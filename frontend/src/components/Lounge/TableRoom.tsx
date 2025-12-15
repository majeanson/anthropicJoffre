/**
 * TableRoom - The pre-game gathering experience
 *
 * When users join a table, this is where they hang out before the game starts.
 * Features:
 * - Visual seat selection (click to sit/stand)
 * - Ready up system
 * - Enhanced table chat with emojis, grouping, scroll to bottom
 * - Table-scoped voice chat
 * - Add bots to fill seats
 * - Start game when ready
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { LoungeTable, ChatMessage, GameState, LoungeVoiceParticipant } from '../../types/game';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { sounds } from '../../utils/sounds';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { useTableVoice } from '../../hooks/useTableVoice';
import { VoiceRoom } from './VoiceRoom';

interface TableRoomProps {
  socket: Socket | null;
  table: LoungeTable;
  playerName: string;
  onLeave: () => void;
  onGameStart: (gameId: string, gameState?: GameState) => void;
}

const QUICK_EMOJIS = ['👍', '😂', '🎮', '🔥', '❤️', '🎉'];

export function TableRoom({
  socket,
  table: initialTable,
  playerName,
  onLeave,
  onGameStart,
}: TableRoomProps) {
  const [table, setTable] = useState<LoungeTable>(initialTable);
  // Initialize chat messages from table's chat history (if any)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    initialTable.chatMessages || []
  );
  const [chatInput, setChatInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  // Loading states for seat actions (tracked by position for sit, 'stand' for stand up)
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Confirmation modals state
  const [confirmRemove, setConfirmRemove] = useState<{ position: number; playerName: string } | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Enhanced chat state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingPlayers, setTypingPlayers] = useState<string[]>([]);

  // Voice chat state
  const [voiceParticipants, setVoiceParticipants] = useState<LoungeVoiceParticipant[]>([]);
  const tableVoice = useTableVoice({ socket, tableId: table.id });

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
      // Clear any pending seat action since the table state has changed
      setPendingAction(null);
    }
  });

  // Listen for chat messages
  useSocketEvent(socket, 'table_chat_message', (data: { message: ChatMessage }) => {
    setChatMessages(prev => [...prev, data.message].slice(-50));
    // Track unread messages when not at bottom
    if (!isAtBottom && data.message.playerName !== playerName) {
      setUnreadCount(prev => prev + 1);
    }
  });

  // Listen for typing indicators
  useSocketEvent(socket, 'table_typing_started', (data: { tableId: string; playerName: string }) => {
    if (data.tableId !== table.id) return;
    setTypingPlayers(prev => {
      if (prev.includes(data.playerName)) return prev;
      return [...prev, data.playerName];
    });
  });

  useSocketEvent(socket, 'table_typing_stopped', (data: { tableId: string; playerName: string }) => {
    if (data.tableId !== table.id) return;
    setTypingPlayers(prev => prev.filter(p => p !== data.playerName));
  });

  // Listen for voice participant updates
  useSocketEvent(socket, 'table_voice_participant_joined', (data: { tableId: string; participant: LoungeVoiceParticipant }) => {
    if (data.tableId !== table.id) return;
    setVoiceParticipants(prev => [...prev, data.participant]);
  });

  useSocketEvent(socket, 'table_voice_participant_left', (data: { tableId: string; playerName: string }) => {
    if (data.tableId !== table.id) return;
    setVoiceParticipants(prev => prev.filter(p => p.playerName !== data.playerName));
  });

  useSocketEvent(socket, 'table_voice_participant_updated', (data: { tableId: string; playerName: string; isMuted: boolean }) => {
    if (data.tableId !== table.id) return;
    setVoiceParticipants(prev => prev.map(p =>
      p.playerName === data.playerName ? { ...p, isMuted: data.isMuted } : p
    ));
  });

  useSocketEvent(socket, 'table_voice_participant_speaking', (data: { tableId: string; playerName: string; isSpeaking: boolean }) => {
    if (data.tableId !== table.id) return;
    setVoiceParticipants(prev => prev.map(p =>
      p.playerName === data.playerName ? { ...p, isSpeaking: data.isSpeaking } : p
    ));
  });

  // Listen for game start
  useSocketEvent(socket, 'table_game_started', (data: { gameId: string; tableId: string; gameState?: GameState }) => {
    if (data.tableId === table.id) {
      setIsStartingGame(false);
      sounds.gameStart();
      onGameStart(data.gameId, data.gameState);
    }
  });

  // Listen for errors (to clear loading states on failures)
  useSocketEvent(socket, 'error', (data: { message: string; context?: string }) => {
    if (data.context === 'start_table_game') {
      setIsStartingGame(false);
    }
    // Clear pending seat actions on any seat-related errors
    if (data.context === 'sit_at_table' || data.context === 'stand_from_table' ||
        data.context === 'add_bot_to_table' || data.context === 'remove_from_seat') {
      setPendingAction(null);
    }
  });

  // Listen for game finished (return to table after game ends)
  useSocketEvent(socket, 'table_game_finished', (data: { tableId: string; previousGameId: string }) => {
    if (data.tableId === table.id) {
      // Update table to show post-game state
      setTable(prev => ({
        ...prev,
        status: 'post_game',
        gameId: undefined,
      }));
      sounds.chatNotification(); // Notify player that game finished
    }
  });

  // Sync ready state with seat
  useEffect(() => {
    if (mySeat) {
      setIsReady(mySeat.isReady);
    }
  }, [mySeat]);

  // Track scroll position for chat
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 50;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (atBottom && !isAtBottom) {
      setUnreadCount(0);
    }

    setIsAtBottom(atBottom);
  }, [isAtBottom]);

  // Auto-scroll to bottom when new messages arrive (if already at bottom)
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAtBottom]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setUnreadCount(0);
  }, []);

  // Timeout for pending seat actions to prevent stuck UI
  useEffect(() => {
    if (!pendingAction) return;

    const timeout = setTimeout(() => {
      setPendingAction(null);
      // Show a toast or console warning - action timed out
      console.warn('Seat action timed out:', pendingAction);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [pendingAction]);

  const handleSitDown = useCallback((position: number) => {
    if (socket && !isSeated && !pendingAction) {
      setPendingAction(`sit:${position}`);
      socket.emit('sit_at_table', { tableId: table.id, position });
      sounds.buttonClick();
    }
  }, [socket, table.id, isSeated, pendingAction]);

  const handleStandUp = useCallback(() => {
    if (socket && isSeated && !pendingAction) {
      setPendingAction('stand');
      socket.emit('stand_from_table', { tableId: table.id });
      sounds.buttonClick();
    }
  }, [socket, table.id, isSeated, pendingAction]);

  const handleToggleReady = useCallback(() => {
    if (socket && isSeated) {
      socket.emit('set_ready', { tableId: table.id, isReady: !isReady });
      sounds.buttonClick();
    }
  }, [socket, table.id, isSeated, isReady]);

  const handleAddBot = useCallback((position: number) => {
    if (socket && isHost && !pendingAction) {
      setPendingAction(`bot:${position}`);
      socket.emit('add_bot_to_table', { tableId: table.id, seatPosition: position, difficulty: 'medium' });
      sounds.buttonClick();
    }
  }, [socket, table.id, isHost, pendingAction]);

  const handleRemoveFromSeat = useCallback((position: number) => {
    if (socket && isHost && !pendingAction) {
      // Find the player name to show in confirmation
      const seat = table.seats.find(s => s.position === position);
      const targetName = seat?.playerName || 'this player';
      setConfirmRemove({ position, playerName: targetName });
      sounds.buttonClick();
    }
  }, [socket, isHost, pendingAction, table.seats]);

  const confirmRemovePlayer = useCallback(() => {
    if (socket && confirmRemove && !pendingAction) {
      setPendingAction(`remove:${confirmRemove.position}`);
      socket.emit('remove_from_seat', { tableId: table.id, seatPosition: confirmRemove.position });
      setConfirmRemove(null);
    }
  }, [socket, table.id, confirmRemove, pendingAction]);

  const handleStartGame = useCallback(() => {
    if (socket && canStart && !isStartingGame) {
      setIsStartingGame(true);
      socket.emit('start_table_game', { tableId: table.id });
      sounds.buttonClick();
    }
  }, [socket, table.id, canStart, isStartingGame]);

  // Typing timeout ref
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    socket?.emit('table_typing', { tableId: table.id, isTyping });
  }, [socket, table.id]);

  // Handle input change with typing indicator
  const handleChatInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChatInput(value);

    if (value.length > 0) {
      sendTypingIndicator(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }
  }, [sendTypingIndicator]);

  const handleSendChat = useCallback(() => {
    if (socket && chatInput.trim()) {
      socket.emit('table_chat', { tableId: table.id, message: chatInput.trim() });
      setChatInput('');
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [socket, table.id, chatInput, sendTypingIndicator]);

  // Handle quick emoji send
  const handleQuickEmoji = useCallback((emoji: string) => {
    if (socket) {
      socket.emit('table_chat', { tableId: table.id, message: emoji });
    }
  }, [socket, table.id]);

  const handleLeave = useCallback(() => {
    // Host leaving will delete the table - show confirmation
    if (isHost) {
      setShowLeaveConfirm(true);
      sounds.buttonClick();
      return;
    }
    if (socket) {
      socket.emit('leave_table', { tableId: table.id });
    }
    onLeave();
    sounds.buttonClick();
  }, [socket, table.id, onLeave, isHost]);

  const confirmLeaveAsHost = useCallback(() => {
    if (socket) {
      socket.emit('leave_table', { tableId: table.id });
    }
    setShowLeaveConfirm(false);
    onLeave();
  }, [socket, table.id, onLeave]);

  // Team colors for visual distinction
  const teamColors = {
    1: 'from-blue-500/20 to-blue-600/10 border-blue-500/50',
    2: 'from-red-500/20 to-red-600/10 border-red-500/50',
  };

  const teamLabels = { 1: 'Team Blue', 2: 'Team Red' };

  return (
    <div className="min-h-screen bg-skin-primary p-4">
      {/* Confirmation Modals */}
      <Modal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Player"
        icon="⚠️"
        theme="red"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemovePlayer}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-skin-primary">
          Are you sure you want to remove <strong>{confirmRemove?.playerName}</strong> from the table?
        </p>
        <p className="text-sm text-skin-muted mt-2">
          They will be able to rejoin the table if there's an open seat.
        </p>
      </Modal>

      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Leave Table"
        icon="⚠️"
        theme="red"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmLeaveAsHost}>
              Leave & Delete
            </Button>
          </>
        }
      >
        <p className="text-skin-primary">
          As the host, leaving will <strong>delete this table</strong> and kick all other players.
        </p>
        <p className="text-sm text-skin-muted mt-2">
          Are you sure you want to leave?
        </p>
      </Modal>

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
              <Button variant="ghost" size="sm" onClick={handleLeave} leftIcon={<span>←</span>}>
                Back to Lounge
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
                  canStand={!(isHost && humanCount === 1)}
                  teamColor={teamColors[1]}
                  pendingAction={pendingAction}
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
                  canStand={!(isHost && humanCount === 1)}
                  teamColor={teamColors[2]}
                  pendingAction={pendingAction}
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
                variant={isReady ? 'success' : 'primary'}
                size="lg"
                onClick={handleToggleReady}
                leftIcon={<span>{isReady ? '✓' : '○'}</span>}
                title={isReady ? 'Click to unready' : 'Mark yourself as ready to play'}
              >
                {isReady ? 'Ready! (Click to Cancel)' : 'Ready Up'}
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

        {/* Chat and Voice Section - Side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Table Chat */}
          <div className="bg-skin-secondary rounded-xl border-2 border-skin-default flex flex-col h-[300px] sm:h-[350px]">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b border-skin-default">
              <span className="text-xl">💬</span>
              <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
                Table Chat
              </h3>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-3 space-y-1"
              role="log"
              aria-label="Table chat messages"
            >
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 text-skin-muted text-sm">
                  <div className="text-2xl mb-2">💭</div>
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">Say hi to your teammates!</p>
                </div>
              ) : (
                chatMessages.map((msg, index) => {
                  const isSelf = msg.playerName === playerName;
                  // Message grouping - same sender within 2 minutes
                  const prevMsg = index > 0 ? chatMessages[index - 1] : null;
                  const isGrouped = prevMsg &&
                    prevMsg.playerName === msg.playerName &&
                    msg.timestamp - prevMsg.timestamp < 2 * 60 * 1000;

                  return (
                    <div
                      key={index}
                      className={`flex ${isSelf ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-2 first:mt-0'}`}
                    >
                      <div className="max-w-[80%]">
                        {!isGrouped && (
                          <div className={`text-xs mb-0.5 ${isSelf ? 'text-right' : ''}`}>
                            <span className={`font-medium ${
                              msg.teamId === 1 ? 'text-blue-400' :
                              msg.teamId === 2 ? 'text-red-400' :
                              isSelf ? 'text-skin-accent' : 'text-skin-primary'
                            }`}>
                              {msg.playerName}
                            </span>
                          </div>
                        )}
                        <div
                          className={`
                            px-3 py-2 rounded-lg text-sm break-words
                            ${isGrouped
                              ? isSelf ? 'rounded-tr-md' : 'rounded-tl-md'
                              : ''
                            }
                            ${isSelf
                              ? 'bg-skin-accent text-skin-inverse'
                              : 'bg-skin-tertiary text-skin-primary'
                            }
                          `}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />

              {/* Scroll to bottom button */}
              {!isAtBottom && chatMessages.length > 0 && (
                <div className="sticky bottom-2 flex justify-center pointer-events-none">
                  <button
                    onClick={scrollToBottom}
                    className="
                      px-3 py-2 rounded-full
                      bg-skin-accent text-skin-inverse
                      shadow-lg shadow-skin-accent/30
                      flex items-center gap-2
                      text-sm font-medium
                      hover:bg-skin-accent/90 transition-all
                      pointer-events-auto
                    "
                    aria-label={unreadCount > 0 ? `${unreadCount} new messages - scroll to bottom` : 'Scroll to bottom'}
                  >
                    <span className="text-lg">↓</span>
                    {unreadCount > 0 && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                        {unreadCount} new
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Typing indicator */}
            {typingPlayers.length > 0 && (
              <div className="px-3 py-1 text-xs text-skin-muted border-t border-skin-default">
                <span className="animate-pulse">
                  {typingPlayers.length === 1
                    ? `${typingPlayers[0]} is typing...`
                    : `${typingPlayers.length} people typing...`
                  }
                </span>
              </div>
            )}

            {/* Quick Emojis */}
            <div className="flex gap-1 px-3 py-2 border-t border-skin-default">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleQuickEmoji(emoji)}
                  className="flex-1 py-1.5 rounded hover:bg-skin-tertiary transition-colors text-sm min-h-[36px]"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 pt-0">
              <input
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-skin-tertiary border border-skin-default rounded-full text-skin-primary text-sm focus:outline-none focus:border-skin-accent"
                aria-label="Chat message input"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                className={`
                  min-w-[44px] min-h-[44px] p-2 rounded-full transition-all flex-shrink-0
                  flex items-center justify-center
                  ${chatInput.trim()
                    ? 'bg-skin-accent text-skin-inverse hover:bg-skin-accent/90 active:scale-95'
                    : 'bg-skin-tertiary text-skin-muted cursor-not-allowed'
                  }
                `}
                title="Send message"
                aria-label="Send message"
              >
                <span className="text-lg">➤</span>
              </button>
            </div>
          </div>

          {/* Table Voice Chat */}
          <VoiceRoom
            playerName={playerName}
            participants={voiceParticipants}
            onJoinVoice={tableVoice.joinVoice}
            onLeaveVoice={tableVoice.leaveVoice}
            onToggleMute={tableVoice.toggleMute}
            onToggleDeafen={tableVoice.toggleDeafen}
            isInVoice={tableVoice.isInVoice}
            isConnecting={tableVoice.isConnecting}
            isMuted={tableVoice.isMuted}
            isDeafened={tableVoice.isDeafened}
            error={tableVoice.error}
            isPushToTalk={tableVoice.isPushToTalk}
            onTogglePushToTalk={tableVoice.togglePushToTalk}
            pttActive={tableVoice.pttActive}
            onSetPttActive={tableVoice.setPttActive}
            participantVolumes={tableVoice.participantVolumes}
            onSetParticipantVolume={tableVoice.setParticipantVolume}
          />
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
  canStand: boolean;
  teamColor: string;
  pendingAction: string | null;
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
  canStand,
  teamColor,
  pendingAction,
  onSit,
  onStand,
  onAddBot,
  onRemove,
}: SeatCardProps) {
  const isEmpty = !seat.playerName;
  const isBot = seat.isBot;

  // Determine loading states for this specific seat
  const isSitting = pendingAction === `sit:${seat.position}`;
  const isStanding = pendingAction === 'stand' && isCurrentPlayer;
  const isAddingBot = pendingAction === `bot:${seat.position}`;
  const isRemoving = pendingAction === `remove:${seat.position}`;
  const hasAnyPending = !!pendingAction;

  // Handle clicking on empty seat to sit
  const handleSeatClick = () => {
    if (isEmpty && canSit && !hasAnyPending) {
      onSit();
    }
  };

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all
        bg-gradient-to-br ${teamColor}
        ${isCurrentPlayer ? 'ring-2 ring-skin-accent ring-offset-2 ring-offset-skin-primary' : ''}
        ${isEmpty ? 'border-dashed opacity-60 hover:opacity-100' : ''}
        ${isEmpty && canSit && !hasAnyPending ? 'cursor-pointer hover:scale-[1.02] hover:border-skin-accent' : ''}
      `}
      onClick={handleSeatClick}
      role={isEmpty && canSit ? 'button' : undefined}
      tabIndex={isEmpty && canSit ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isEmpty && canSit && !hasAnyPending) {
          e.preventDefault();
          onSit();
        }
      }}
    >
      {isEmpty ? (
        // Empty seat - clickable area
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-skin-tertiary border-2 border-dashed border-skin-default flex items-center justify-center">
            <span className="text-2xl text-skin-muted">?</span>
          </div>
          <p className="text-sm text-skin-muted">
            {canSit ? (isSitting ? 'Sitting...' : 'Click to Sit') : 'Empty Seat'}
          </p>
          <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
            {isHost && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onAddBot}
                disabled={hasAnyPending}
                loading={isAddingBot}
              >
                {isAddingBot ? 'Adding...' : '+ Bot'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Occupied seat
        <div className="text-center space-y-2">
          <div
            className={`
              w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl
              ${isBot ? 'bg-skin-muted' : 'bg-skin-accent'}
            `}
            title={isBot ? `Bot: ${seat.playerName}` : seat.playerName || undefined}
            aria-label={isBot ? `Bot player: ${seat.playerName}` : `Player: ${seat.playerName}`}
          >
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
              <Button
                variant="ghost"
                size="xs"
                onClick={onStand}
                disabled={hasAnyPending || !canStand}
                loading={isStanding}
                title={!canStand ? 'Host cannot stand up alone. Leave the table instead.' : undefined}
              >
                {isStanding ? 'Standing...' : 'Stand Up'}
              </Button>
            )}
            {isHost && !isCurrentPlayer && (
              <Button
                variant="danger"
                size="xs"
                onClick={onRemove}
                disabled={hasAnyPending}
                loading={isRemoving}
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TableRoom;

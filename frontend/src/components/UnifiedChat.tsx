/**
 * UnifiedChat Component
 * Sprint 16 Task 4.1
 *
 * Reusable chat component that consolidates patterns from ChatPanel, FloatingTeamChat, and LobbyChat.
 * Supports multiple chat contexts (team, game, lobby, DM) with consistent UI and behavior.
 *
 * Features:
 * - Multiple display modes (panel, floating, embedded, modal)
 * - Message filtering (team, all, DMs)
 * - Emoji picker
 * - Quick reactions
 * - Unread counter
 * - Auto-scroll to new messages
 * - Typing indicators (future)
 * - Message timestamps
 *
 * Usage:
 * ```tsx
 * <UnifiedChat
 *   mode="floating"
 *   context="team"
 *   socket={socket}
 *   gameId={gameId}
 *   currentPlayerId={currentPlayerId}
 *   messages={messages}
 *   onSendMessage={(message) => socket.emit('send_team_chat', { gameId, message })}
 * />
 * ```
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types/game';
import { EmojiPicker } from './EmojiPicker';
import { PlayerNameButton } from './PlayerNameButton';
import { Button, UIBadge, Input, IconButton } from './ui';

type ChatMode = 'panel' | 'floating' | 'embedded' | 'modal';
type ChatContext = 'team' | 'game' | 'lobby' | 'dm';

interface UnifiedChatProps {
  // Display
  mode: ChatMode;
  context: ChatContext;
  title?: string;
  isOpen?: boolean; // For panel/modal modes
  onClose?: () => void; // For panel/modal modes

  // Data
  socket: Socket | null;
  gameId?: string;
  currentPlayerId: string;
  messages: ChatMessage[];

  // Callbacks
  onSendMessage: (message: string) => void;
  onPlayerClick?: (playerName: string) => void;

  // Behavior
  showQuickEmojis?: boolean;
  showEmojiPicker?: boolean;
  showUnreadCounter?: boolean;
  maxMessages?: number;
  placeholder?: string;

  // Styling
  className?: string;
  compact?: boolean;
}

export function UnifiedChat({
  mode,
  context,
  title,
  isOpen = true,
  onClose,
  currentPlayerId,
  messages,
  onSendMessage,
  onPlayerClick,
  showQuickEmojis = true,
  showEmojiPicker = true,
  showUnreadCounter = true,
  maxMessages = 100,
  placeholder = 'Type a message...',
  className = '',
  compact = false
}: UnifiedChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(mode !== 'floating'); // Start collapsed for floating mode
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick emoji reactions
  const quickEmojis = ['👍', '👎', '🔥', '😂', 'GG', '✨'];

  // Get title based on context
  const chatTitle = title || {
    team: '💬 Team Chat',
    game: '💬 Game Chat',
    lobby: '💬 Lobby Chat',
    dm: '💬 Direct Message'
  }[context];

  // Auto-scroll to bottom
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Update unread counter when collapsed (floating mode)
  useEffect(() => {
    if (mode === 'floating' && !isExpanded && showUnreadCounter && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.playerId !== currentPlayerId) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isExpanded, currentPlayerId, mode, showUnreadCounter]);

  // Reset unread when expanded
  useEffect(() => {
    if (isExpanded) {
      setUnreadCount(0);
    }
  }, [isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Handle send message
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    onSendMessage(inputMessage.trim());
    setInputMessage('');
    inputRef.current?.focus();
  }, [inputMessage, onSendMessage]);

  // Handle quick emoji
  const handleQuickEmoji = useCallback((emoji: string) => {
    onSendMessage(emoji);
  }, [onSendMessage]);

  // Handle emoji picker selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  }, []);

  // Toggle floating chat
  const toggleChat = () => {
    setIsExpanded(!isExpanded);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Floating button (collapsed state)
  if (mode === 'floating' && !isExpanded) {
    return (
      <Button
        onClick={toggleChat}
        variant="primary"
        className="fixed bottom-4 right-4 rounded-full shadow-lg z-40 hover:scale-105 transition-transform"
        data-testid="unified-chat-button"
      >
        <span className="text-xl">💬</span>
        <span className="font-semibold">Chat</span>
        {unreadCount > 0 && (
          <UIBadge
            variant="solid"
            color="error"
            size="xs"
            pulse
            className="ml-1"
          >
            {unreadCount}
          </UIBadge>
        )}
      </Button>
    );
  }

  // Panel/modal close guard
  if ((mode === 'panel' || mode === 'modal') && !isOpen) return null;

  // Container styles based on mode
  const containerClasses = {
    panel: 'fixed right-4 bottom-4 w-80 md:w-80 bg-parchment-50 dark:bg-gray-800 rounded-lg shadow-2xl border-4 border-amber-700 dark:border-gray-600 flex flex-col max-h-96 z-50',
    floating: 'fixed bottom-4 right-4 w-[90vw] sm:w-80 max-w-[calc(100vw-2rem)] max-h-[80vh] sm:max-h-[500px] bg-parchment-50 dark:bg-gray-800 border-2 border-amber-700 dark:border-gray-600 rounded-lg shadow-2xl z-40 flex flex-col animate-slide-in',
    embedded: 'w-full bg-parchment-50 dark:bg-gray-800 border-2 border-amber-700 dark:border-gray-600 rounded-lg flex flex-col',
    modal: 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'
  }[mode];

  const contentClasses = mode === 'modal'
    ? 'bg-parchment-50 dark:bg-gray-800 rounded-lg shadow-2xl border-4 border-amber-700 dark:border-gray-600 w-full max-w-2xl flex flex-col max-h-[80vh]'
    : '';

  const modalBackdrop = mode === 'modal' ? (
    <div className={containerClasses} onClick={onClose}>
      <div className={contentClasses} onClick={(e) => e.stopPropagation()}>
        {renderChatContent()}
      </div>
    </div>
  ) : null;

  function renderChatContent() {
    return (
      <>
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 dark:from-gray-700 dark:to-gray-900 text-parchment-50 dark:text-gray-100 px-4 py-3 rounded-t-md flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">{chatTitle}</h3>
          <div className="flex items-center gap-2">
            {mode === 'floating' && (
              <IconButton
                onClick={toggleChat}
                icon="−"
                ariaLabel="Minimize"
                variant="minimal"
                size="sm"
                className="text-parchment-50 hover:text-parchment-200 hover:bg-white/10"
              />
            )}
            {(mode === 'panel' || mode === 'modal') && onClose && (
              <IconButton
                onClick={onClose}
                icon="×"
                ariaLabel="Close"
                variant="minimal"
                size="sm"
                className="text-parchment-50 hover:text-parchment-200 hover:bg-white/10"
              />
            )}
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-3 bg-parchment-100 dark:bg-gray-700 ${compact ? 'min-h-[150px] max-h-[200px]' : 'min-h-[150px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px]'}`}>
          {messages.length === 0 ? (
            <p className="text-sm text-umber-500 dark:text-gray-400 text-center py-4">
              No messages yet. Say something!
            </p>
          ) : (
            <div className="space-y-2">
              {messages.slice(-maxMessages).map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm ${
                    msg.playerId === currentPlayerId
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500'
                      : 'bg-white dark:bg-gray-600'
                  } p-2 rounded shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    {onPlayerClick ? (
                      <PlayerNameButton
                        playerName={msg.playerName}
                        onClick={() => onPlayerClick(msg.playerName)}
                        variant="inline"
                        className="text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-amber-900 dark:text-amber-400 text-xs">
                        {msg.playerName}
                      </span>
                    )}
                    <span className="text-xs text-umber-500 dark:text-gray-400">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-umber-900 dark:text-gray-100 break-words">
                    {msg.message}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Emojis */}
        {showQuickEmojis && (
          <div className="flex-shrink-0 px-2 sm:px-3 py-2 bg-parchment-100 dark:bg-gray-700 border-t border-amber-200 dark:border-gray-600 flex gap-1 sm:gap-2 flex-wrap">
            {quickEmojis.map((emoji) => (
              <Button
                key={emoji}
                onClick={() => handleQuickEmoji(emoji)}
                variant="ghost"
                size="sm"
                type="button"
                className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm"
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex-shrink-0 p-2 sm:p-3 bg-parchment-50 dark:bg-gray-800 border-t border-amber-200 dark:border-gray-600 rounded-b-md">
          <div className="flex gap-1 sm:gap-2 items-center">
            {showEmojiPicker && (
              <div className="relative flex-shrink-0">
                <Button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  variant="warning"
                  size="sm"
                  aria-label="Emoji picker"
                  className="h-[38px]"
                >
                  😀
                </Button>
                {showEmojis && (
                  <div className="absolute bottom-full mb-2 left-0 z-10">
                    <EmojiPicker onSelectEmoji={handleEmojiSelect} onClose={() => setShowEmojis(false)} />
                  </div>
                )}
              </div>
            )}
            <Input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              size="sm"
              className="flex-1 min-w-0 h-[38px]"
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim()}
              variant="warning"
              size="sm"
              className="flex-shrink-0 h-[38px]"
            >
              Send
            </Button>
          </div>
        </form>
      </>
    );
  }

  return mode === 'modal' ? modalBackdrop : (
    <div className={`${containerClasses} ${className}`} data-testid="unified-chat">
      {renderChatContent()}
    </div>
  );
}

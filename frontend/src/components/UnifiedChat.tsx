/**
 * UnifiedChat Component - Multi-Skin Edition
 *
 * Reusable chat component for team, game, lobby, and DM contexts.
 * Uses CSS variables for skin compatibility.
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
  mode: ChatMode;
  context: ChatContext;
  title?: string;
  isOpen?: boolean;
  onClose?: () => void;
  socket: Socket | null;
  gameId?: string;
  currentPlayerId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onPlayerClick?: (playerName: string) => void;
  showQuickEmojis?: boolean;
  showEmojiPicker?: boolean;
  showUnreadCounter?: boolean;
  maxMessages?: number;
  placeholder?: string;
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
  const [isExpanded, setIsExpanded] = useState(mode !== 'floating');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickEmojis = ['👍', '👎', '🔥', '😂', 'GG', '✨'];

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

  // Update unread counter when collapsed
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

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
    inputRef.current?.focus();
  }, [inputMessage, onSendMessage]);

  const handleQuickEmoji = useCallback((emoji: string) => {
    onSendMessage(emoji);
  }, [onSendMessage]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  }, []);

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
  };

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
  const getContainerStyle = (): React.CSSProperties => ({
    backgroundColor: 'var(--color-bg-secondary)',
    borderColor: 'var(--color-border-accent)',
    boxShadow: 'var(--shadow-glow)',
  });

  const containerClasses = {
    panel: 'fixed right-4 bottom-4 w-80 md:w-80 rounded-[var(--radius-lg)] shadow-2xl border-2 flex flex-col max-h-96 z-50',
    floating: 'fixed bottom-4 right-4 w-72 sm:w-80 max-w-[calc(100vw-2rem)] max-h-[60vh] sm:max-h-[500px] border-2 rounded-[var(--radius-lg)] shadow-2xl z-40 flex flex-col animate-slide-in',
    embedded: 'w-full border-2 rounded-[var(--radius-lg)] flex flex-col',
    modal: 'fixed inset-0 flex items-center justify-center z-50 p-4'
  }[mode];

  function renderChatContent() {
    return (
      <>
        {/* Header */}
        <div
          className="px-4 py-3 rounded-t-[var(--radius-lg)] flex justify-between items-center"
          style={{
            background: 'linear-gradient(to right, var(--color-bg-tertiary), var(--color-bg-secondary))',
            borderBottom: '1px solid var(--color-border-default)',
          }}
        >
          <h3
            className="font-bold flex items-center gap-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {chatTitle}
          </h3>
          <div className="flex items-center gap-2">
            {mode === 'floating' && (
              <IconButton
                onClick={toggleChat}
                icon="−"
                ariaLabel="Minimize"
                variant="minimal"
                size="sm"
              />
            )}
            {(mode === 'panel' || mode === 'modal') && onClose && (
              <IconButton
                onClick={onClose}
                icon="×"
                ariaLabel="Close"
                variant="minimal"
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto p-3 ${compact ? 'min-h-[150px] max-h-[200px]' : 'min-h-[150px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px]'}`}
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          {messages.length === 0 ? (
            <p
              className="text-sm text-center py-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No messages yet. Say something!
            </p>
          ) : (
            <div className="space-y-2">
              {messages.slice(-maxMessages).map((msg, idx) => (
                <div
                  key={idx}
                  className="text-sm p-2 rounded-[var(--radius-md)] shadow-sm"
                  style={{
                    backgroundColor: msg.playerId === currentPlayerId
                      ? 'var(--color-info)'
                      : 'var(--color-bg-secondary)',
                    borderLeft: msg.playerId === currentPlayerId
                      ? '2px solid var(--color-text-accent)'
                      : 'none',
                  }}
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
                      <span
                        className="font-semibold text-xs"
                        style={{ color: 'var(--color-text-accent)' }}
                      >
                        {msg.playerName}
                      </span>
                    )}
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p
                    className="break-words"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
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
          <div
            className="flex-shrink-0 px-2 sm:px-3 py-2 border-t flex gap-1 sm:gap-2 flex-wrap"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
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
        <form
          onSubmit={handleSendMessage}
          className="flex-shrink-0 p-2 sm:p-3 border-t rounded-b-[var(--radius-lg)]"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
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

  // Modal rendering
  if (mode === 'modal') {
    return (
      <div
        className={containerClasses}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      >
        <div
          className="rounded-[var(--radius-lg)] shadow-2xl border-2 w-full max-w-2xl flex flex-col max-h-[80vh]"
          style={getContainerStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {renderChatContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${containerClasses} ${className}`}
      style={getContainerStyle()}
      data-testid="unified-chat"
    >
      {renderChatContent()}
    </div>
  );
}

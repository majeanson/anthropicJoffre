/**
 * LoungeChat - Enhanced chat with @mentions
 *
 * Main chat for the lounge with support for @mentions
 * and quick emoji reactions.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage, LoungePlayer } from '../../types/game';
import { useSocketEvent } from '../../hooks/useSocketEvent';

interface LoungeChatProps {
  socket: Socket | null;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  playerName: string;
  onlinePlayers: LoungePlayer[];
}

const QUICK_EMOJIS = ['👍', '👎', '😂', '🔥', '❤️', 'GG'];

export function LoungeChat({
  socket,
  messages: initialMessages,
  onSendMessage,
  playerName,
  onlinePlayers,
}: LoungeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const MAX_MESSAGE_LENGTH = 500;

  // Update messages when initial messages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Listen for new messages
  useSocketEvent(socket, 'lounge_chat_message', (data: { message: ChatMessage }) => {
    setMessages(prev => [...prev, data.message]);
  });

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 50; // pixels from bottom to consider "at bottom"
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  // Auto-scroll to bottom only if user was already at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Filter players for @mention
  const filteredPlayers = onlinePlayers
    .filter(p => p.playerName !== playerName)
    .filter(p => p.playerName.toLowerCase().includes(mentionFilter.toLowerCase()))
    .slice(0, 5);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const afterAt = value.slice(lastAtIndex + 1);
      // Only show if @ is at start or after space
      if (lastAtIndex === 0 || value[lastAtIndex - 1] === ' ') {
        if (!afterAt.includes(' ')) {
          setShowMentions(true);
          setMentionFilter(afterAt);
          setMentionIndex(0);
          return;
        }
      }
    }
    setShowMentions(false);
  };

  // Handle mention selection
  const selectMention = useCallback((name: string) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.slice(0, lastAtIndex) + `@${name} `;
    setInputValue(newValue);
    setShowMentions(false);
    inputRef.current?.focus();
  }, [inputValue]);

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredPlayers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, filteredPlayers.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filteredPlayers[mentionIndex].playerName);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
      return;
    }

    if (e.key === 'Enter' && inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  // Handle quick emoji
  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  // Format message with @mentions highlighted
  const formatMessage = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const mentioned = part.slice(1);
        const isSelf = mentioned.toLowerCase() === playerName.toLowerCase();
        return (
          <span
            key={i}
            className={`font-medium ${isSelf ? 'bg-skin-accent/30 text-skin-accent px-1 rounded' : 'text-skin-info'}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-skin-secondary rounded-xl border-2 border-skin-default flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-skin-default">
        <span className="text-xl">💬</span>
        <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
          Lounge Chat
        </h3>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-skin-muted text-sm">
            <div className="text-2xl mb-2">💭</div>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Say hi!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSelf = msg.playerName === playerName;
            const isSystem = msg.playerName === 'System';

            if (isSystem) {
              return (
                <div key={i} className="text-center text-xs text-skin-muted py-1">
                  {msg.message}
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg px-3 py-2
                    ${isSelf
                      ? 'bg-skin-accent text-skin-inverse'
                      : 'bg-skin-tertiary text-skin-primary'
                    }
                  `}
                >
                  {!isSelf && (
                    <div className="text-xs font-medium text-skin-info mb-1">
                      {msg.playerName}
                    </div>
                  )}
                  <div className="text-sm break-words">
                    {formatMessage(msg.message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      <div className="flex gap-1 px-3 py-2 border-t border-skin-default">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="flex-1 py-1 rounded hover:bg-skin-tertiary transition-colors text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="relative p-3 pt-0">
        {/* Mention suggestions - positioned above on desktop, below on mobile */}
        {showMentions && filteredPlayers.length > 0 && (
          <div className="absolute left-3 right-3 sm:bottom-full sm:mb-1 sm:top-auto top-full mt-1 bg-skin-tertiary rounded-lg border border-skin-default shadow-lg overflow-hidden z-20">
            {filteredPlayers.map((p, i) => (
              <button
                key={p.socketId}
                onClick={() => selectMention(p.playerName)}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                  ${i === mentionIndex ? 'bg-skin-accent text-skin-inverse' : 'hover:bg-skin-primary'}
                `}
              >
                <span>@{p.playerName}</span>
                {p.isFriend && <span className="text-xs">⭐</span>}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Type a message (use @name to mention)"
            className="w-full px-4 py-2 pr-16 rounded-full bg-skin-tertiary text-skin-primary placeholder-skin-muted border border-skin-default focus:border-skin-accent focus:outline-none focus:ring-2 focus:ring-skin-accent/30 text-sm"
          />
          {/* Character counter - shows when approaching limit */}
          {inputValue.length > MAX_MESSAGE_LENGTH * 0.8 && (
            <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs ${
              inputValue.length >= MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-skin-muted'
            }`}>
              {inputValue.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoungeChat;

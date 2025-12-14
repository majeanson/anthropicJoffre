/**
 * LoungeChat - Enhanced chat with @mentions, reactions, replies, media, and persistence
 *
 * Main chat for the lounge with support for:
 * - @mentions with autocomplete
 * - Message reactions (emoji reactions)
 * - Replies to messages
 * - GIF/image media
 * - Typing indicators
 * - Edit/delete messages
 * - Search functionality
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import {
  LoungeChatMessage,
  LoungePlayer,
  MessageReaction,
  LoungeChatPayload,
} from '../../types/game';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { GifPicker } from './GifPicker';
import { EmojiPicker } from './EmojiPicker';
import { renderMarkdown } from '../../utils/markdown';

interface LoungeChatProps {
  socket: Socket | null;
  messages: LoungeChatMessage[];
  onSendMessage: (payload: LoungeChatPayload) => void;
  playerName: string;
  onlinePlayers: LoungePlayer[];
  typingPlayers?: string[];
}

const QUICK_EMOJIS = ['👍', '👎', '😂', '🔥', '❤️', '🎉'];

export function LoungeChat({
  socket,
  messages: initialMessages,
  onSendMessage,
  playerName,
  onlinePlayers,
  typingPlayers: initialTypingPlayers = [],
}: LoungeChatProps) {
  const [messages, setMessages] = useState<LoungeChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [typingPlayers, setTypingPlayers] = useState<string[]>(initialTypingPlayers);
  const [replyingTo, setReplyingTo] = useState<LoungeChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<LoungeChatMessage | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [searchResults, setSearchResults] = useState<LoungeChatMessage[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true); // Assume more until proven otherwise
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const tempIdCounter = useRef(-1); // Negative IDs for pending messages

  // Track "new messages" divider - the last message ID seen when user was at bottom
  const [lastSeenMessageId, setLastSeenMessageId] = useState<number | null>(null);
  const [showNewMessagesDivider, setShowNewMessagesDivider] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Track highlighted message (from search)
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const MAX_MESSAGE_LENGTH = 2000;

  // Update messages when initial messages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Update typing players when initial changes
  useEffect(() => {
    setTypingPlayers(initialTypingPlayers);
  }, [initialTypingPlayers]);

  // Listen for new messages
  useSocketEvent(socket, 'lounge_chat_message', (data: { message: LoungeChatMessage }) => {
    setMessages(prev => {
      // Avoid duplicates by checking messageId
      if (prev.some(m => m.messageId === data.message.messageId)) {
        return prev;
      }

      // If this is our own message, replace the pending version
      if (data.message.playerName === playerName) {
        // Find pending message with matching content (negative ID)
        const pendingIndex = prev.findIndex(
          m => m.messageId < 0 && m.message === data.message.message && m.deliveryStatus === 'sending'
        );
        if (pendingIndex >= 0) {
          // Replace pending with confirmed message
          const updated = [...prev];
          updated[pendingIndex] = { ...data.message, deliveryStatus: 'sent' };
          return updated;
        }
      }

      // Add new message (from others or if no pending match found)
      return [...prev, { ...data.message, deliveryStatus: 'sent' }];
    });

    // Track unread messages when not at bottom and message is from someone else
    if (!isAtBottom && data.message.playerName !== playerName) {
      setShowNewMessagesDivider(true);
      setUnreadCount(prev => prev + 1);
    }
  });

  // Listen for message edits
  useSocketEvent(socket, 'lounge_message_edited', (data: { messageId: number; newText: string; editedAt: number }) => {
    setMessages(prev => prev.map(msg =>
      msg.messageId === data.messageId
        ? { ...msg, message: data.newText, isEdited: true, editedAt: data.editedAt }
        : msg
    ));
  });

  // Listen for message deletions
  useSocketEvent(socket, 'lounge_message_deleted', (data: { messageId: number }) => {
    setMessages(prev => prev.filter(msg => msg.messageId !== data.messageId));
  });

  // Listen for reaction updates
  useSocketEvent(socket, 'lounge_reaction_updated', (data: {
    messageId: number;
    reactions: MessageReaction[];
  }) => {
    setMessages(prev => prev.map(msg =>
      msg.messageId === data.messageId
        ? { ...msg, reactions: data.reactions }
        : msg
    ));
  });

  // Listen for link preview updates
  useSocketEvent(socket, 'lounge_message_updated', (data: {
    messageId: number;
    linkPreview?: LoungeChatMessage['linkPreview'];
  }) => {
    setMessages(prev => prev.map(msg =>
      msg.messageId === data.messageId
        ? { ...msg, linkPreview: data.linkPreview }
        : msg
    ));
  });

  // Listen for typing indicators
  useSocketEvent(socket, 'lounge_typing_started', (data: { playerName: string }) => {
    setTypingPlayers(prev => {
      if (prev.includes(data.playerName)) return prev;
      return [...prev, data.playerName];
    });
  });

  useSocketEvent(socket, 'lounge_typing_stopped', (data: { playerName: string }) => {
    setTypingPlayers(prev => prev.filter(p => p !== data.playerName));
  });

  // Listen for mention notifications
  useSocketEvent(socket, 'lounge_mention', (_data: {
    messageId: number;
    mentionedBy: string;
    messagePreview: string;
  }) => {
    // Play mention sound if available
    try {
      const audio = new Audio('/sounds/mention.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Ignore audio errors
    }
  });

  // Listen for search results
  useSocketEvent(socket, 'lounge_search_results', (data: {
    query: string;
    messages: LoungeChatMessage[];
    count: number;
  }) => {
    setSearchResults(data.messages);
    setIsSearching(false);
  });

  // Listen for chat history (load more)
  useSocketEvent(socket, 'lounge_chat_history', (data: {
    messages: LoungeChatMessage[];
    hasMore: boolean;
  }) => {
    setIsLoadingMore(false);
    setHasMoreMessages(data.hasMore);
    if (data.messages.length > 0) {
      // Prepend older messages (they come in reverse order, oldest first)
      setMessages(prev => [...data.messages, ...prev]);
    }
  });

  // Track scroll position and manage "new messages" state
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 50;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    // When user reaches bottom, clear the "new messages" divider
    if (atBottom && !isAtBottom) {
      setShowNewMessagesDivider(false);
      setUnreadCount(0);
      // Update last seen to most recent message
      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        setLastSeenMessageId(lastMsg.messageId);
      }
    }

    // When user scrolls away from bottom, record the last seen message
    if (!atBottom && isAtBottom) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg) {
        setLastSeenMessageId(lastMsg.messageId);
      }
    }

    setIsAtBottom(atBottom);
  }, [isAtBottom, messages]);

  // Auto-scroll to bottom only if user was already at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Scroll to bottom handler (for button click)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setShowNewMessagesDivider(false);
    setUnreadCount(0);
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      setLastSeenMessageId(lastMsg.messageId);
    }
  }, [messages]);

  // Scroll to a specific message and highlight it (for search results)
  const scrollToMessage = useCallback((messageId: number) => {
    // Close search results first
    setSearchResults(null);

    // Find the message ref and scroll to it
    setTimeout(() => {
      const messageEl = messageRefs.current.get(messageId);
      if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight the message
        setHighlightedMessageId(messageId);

        // Clear highlight after 2 seconds
        setTimeout(() => {
          setHighlightedMessageId(null);
        }, 2000);
      }
    }, 100); // Small delay to allow search results to close
  }, []);

  // Filter players for @mention
  const filteredPlayers = useMemo(() =>
    onlinePlayers
      .filter(p => p.playerName !== playerName)
      .filter(p => p.playerName.toLowerCase().includes(mentionFilter.toLowerCase()))
      .slice(0, 5),
    [onlinePlayers, playerName, mentionFilter]
  );

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    socket?.emit('lounge_typing', { isTyping });
  }, [socket]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Send typing indicator
    if (value.length > 0) {
      sendTypingIndicator(true);
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }

    // Check for @mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const afterAt = value.slice(lastAtIndex + 1);
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

    if (e.key === 'Escape') {
      if (replyingTo) {
        setReplyingTo(null);
      } else if (editingMessage) {
        setEditingMessage(null);
        setInputValue('');
      }
      return;
    }

    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  // Send message or save edit
  const handleSend = () => {
    if (!inputValue.trim() && !editingMessage) return;

    if (editingMessage) {
      // Edit message
      socket?.emit('edit_message', {
        messageId: editingMessage.messageId,
        newText: inputValue.trim(),
      });
      setEditingMessage(null);
    } else if (inputValue.trim()) {
      const messageText = inputValue.trim();

      // Add optimistic message with 'sending' status
      const tempId = tempIdCounter.current--;
      const optimisticMessage: LoungeChatMessage = {
        messageId: tempId,
        playerName,
        message: messageText,
        timestamp: Date.now(),
        replyToId: replyingTo?.messageId || null,
        replyTo: replyingTo ? {
          messageId: replyingTo.messageId,
          playerName: replyingTo.playerName,
          message: replyingTo.message,
        } : null,
        deliveryStatus: 'sending',
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Send to server
      onSendMessage({
        message: messageText,
        replyToId: replyingTo?.messageId || null,
      });
      setReplyingTo(null);

      // Set timeout to mark as failed if no response
      setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.messageId === tempId && m.deliveryStatus === 'sending'
            ? { ...m, deliveryStatus: 'failed' }
            : m
        ));
      }, 10000); // 10 second timeout
    }

    setInputValue('');
    sendTypingIndicator(false);
  };

  // Handle quick emoji
  const handleQuickEmoji = (emoji: string) => {
    // Add optimistic message
    const tempId = tempIdCounter.current--;
    const optimisticMessage: LoungeChatMessage = {
      messageId: tempId,
      playerName,
      message: emoji,
      timestamp: Date.now(),
      deliveryStatus: 'sending',
    };
    setMessages(prev => [...prev, optimisticMessage]);

    onSendMessage({ message: emoji });

    // Set timeout to mark as failed if no response
    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.messageId === tempId && m.deliveryStatus === 'sending'
          ? { ...m, deliveryStatus: 'failed' }
          : m
      ));
    }, 10000);
  };

  // Handle reaction toggle
  const handleReaction = (messageId: number, emoji: string) => {
    socket?.emit('toggle_reaction', { messageId, emoji });
    setShowReactionPicker(null);
  };

  // Handle reply
  const handleReply = (message: LoungeChatMessage) => {
    setReplyingTo(message);
    setEditingMessage(null);
    inputRef.current?.focus();
  };

  // Handle edit
  const handleEdit = (message: LoungeChatMessage) => {
    setEditingMessage(message);
    setInputValue(message.message);
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  // Handle delete
  const handleDelete = (messageId: number) => {
    if (confirm('Delete this message?')) {
      socket?.emit('delete_message', { messageId });
    }
  };

  // Handle loading more messages
  const handleLoadMore = useCallback(() => {
    if (!socket || isLoadingMore || !hasMoreMessages) return;

    // Find the oldest message (smallest positive messageId)
    const positiveMessages = messages.filter(m => m.messageId > 0);
    if (positiveMessages.length === 0) return;

    const oldestId = Math.min(...positiveMessages.map(m => m.messageId));
    setIsLoadingMore(true);
    socket.emit('get_lounge_chat', { beforeId: oldestId, limit: 50 });
  }, [socket, isLoadingMore, hasMoreMessages, messages]);

  // Handle GIF selection
  const handleGifSelect = (gif: { url: string; thumbnailUrl: string; altText: string }) => {
    onSendMessage({
      message: '',
      mediaType: 'gif',
      mediaUrl: gif.url,
      mediaThumbnailUrl: gif.thumbnailUrl,
      mediaAltText: gif.altText,
      replyToId: replyingTo?.messageId || null,
    });
    setReplyingTo(null);
    setShowGifPicker(false);
  };

  // Format message with markdown and @mentions highlighted
  const formatMessage = (text: string) => {
    // Split on @mentions to preserve them
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        // @mention - render as highlighted span
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
      // Regular text - apply markdown formatting
      return <span key={i}>{renderMarkdown(part)}</span>;
    });
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render reactions
  const renderReactions = (message: LoungeChatMessage) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {message.reactions.map(reaction => {
          const hasReacted = reaction.players.includes(playerName);
          return (
            <button
              key={reaction.emoji}
              onClick={() => handleReaction(message.messageId, reaction.emoji)}
              className={`
                flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs
                ${hasReacted
                  ? 'bg-skin-accent/30 border border-skin-accent'
                  : 'bg-skin-tertiary border border-skin-default hover:border-skin-accent'
                }
              `}
              title={reaction.players.join(', ')}
            >
              <span>{reaction.emoji}</span>
              <span className="text-skin-muted">{reaction.count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-skin-secondary rounded-xl border-2 border-skin-default flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-skin-default">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
            Lounge Chat
          </h3>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-1.5 rounded hover:bg-skin-tertiary transition-colors ${showSearch ? 'bg-skin-accent/20' : ''}`}
          title="Search messages"
        >
          <span className="text-sm">🔍</span>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-skin-default">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length === 0) {
                  setSearchResults(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                  setIsSearching(true);
                  socket?.emit('search_lounge_messages', { query: searchQuery.trim() });
                } else if (e.key === 'Escape') {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowSearch(false);
                }
              }}
              placeholder="Search messages... (Enter to search)"
              className="flex-1 px-3 py-1.5 rounded bg-skin-tertiary text-skin-primary text-sm border border-skin-default focus:border-skin-accent focus:outline-none"
            />
            {(searchQuery || searchResults) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="px-2 py-1 text-xs text-skin-muted hover:text-skin-primary rounded hover:bg-skin-tertiary"
                title="Clear search"
              >
                Clear
              </button>
            )}
          </div>
          {isSearching && (
            <div className="text-xs text-skin-muted mt-1 animate-pulse">Searching...</div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults !== null && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-skin-tertiary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-skin-muted">
              {searchResults.length === 0
                ? 'No results found'
                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => setSearchResults(null)}
              className="text-xs text-skin-info hover:underline"
            >
              Back to chat
            </button>
          </div>
          {searchResults.map((msg) => {
            const isSelf = msg.playerName === playerName;
            return (
              <div
                key={msg.messageId}
                className="p-2 rounded-lg bg-skin-secondary border border-skin-default hover:border-skin-accent cursor-pointer"
                onClick={() => scrollToMessage(msg.messageId)}
              >
                <div className="flex items-center gap-2 text-xs text-skin-muted mb-1">
                  <span className={isSelf ? 'text-skin-accent font-medium' : 'font-medium text-skin-primary'}>
                    {msg.playerName}
                  </span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div className="text-sm text-skin-primary">{formatMessage(msg.message)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`relative flex-1 overflow-y-auto p-3 space-y-2 ${searchResults !== null ? 'hidden' : ''}`}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Load more button */}
        {hasMoreMessages && messages.length > 0 && (
          <div className="text-center py-2">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-1.5 text-xs text-skin-info hover:text-skin-primary hover:bg-skin-tertiary rounded-full transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8 text-skin-muted text-sm">
            <div className="text-2xl mb-2">💭</div>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Say hi!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.playerName === playerName;
            const isSystem = msg.playerName === 'System';
            const isHovered = hoveredMessage === msg.messageId;
            const isHighlighted = highlightedMessageId === msg.messageId;

            // Check if this message should be grouped with the previous one
            // Group if: same sender, within 5 minutes, and not a system message
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isGrouped = prevMsg &&
              !isSystem &&
              prevMsg.playerName === msg.playerName &&
              prevMsg.playerName !== 'System' &&
              (msg.timestamp - prevMsg.timestamp) < 5 * 60 * 1000; // 5 minutes

            // Check if we should show the "new messages" divider before this message
            const showDividerBeforeThis = showNewMessagesDivider &&
              lastSeenMessageId !== null &&
              index > 0 &&
              messages[index - 1].messageId === lastSeenMessageId;

            if (isSystem) {
              return (
                <div key={msg.messageId} className="text-center text-xs text-skin-muted py-1">
                  {msg.message}
                </div>
              );
            }

            return (
              <div
                key={msg.messageId}
                ref={(el) => {
                  if (el) messageRefs.current.set(msg.messageId, el);
                  else messageRefs.current.delete(msg.messageId);
                }}
                className={isHighlighted ? 'animate-pulse bg-skin-accent/10 rounded-lg -mx-1 px-1' : ''}
              >
                {/* New messages divider */}
                {showDividerBeforeThis && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-red-500/50" />
                    <span className="text-xs text-red-400 font-medium px-2">
                      New messages
                    </span>
                    <div className="flex-1 h-px bg-red-500/50" />
                  </div>
                )}

                <div
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-2 first:mt-0'}`}
                onMouseEnter={() => setHoveredMessage(msg.messageId)}
                onMouseLeave={() => {
                  setHoveredMessage(null);
                  setShowReactionPicker(null);
                }}
              >
                <div className="relative max-w-[80%]">
                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div className="text-xs text-skin-muted mb-1 pl-2 border-l-2 border-skin-default">
                      <span className="font-medium">↩ {msg.replyTo.playerName}</span>: {msg.replyTo.message.slice(0, 50)}...
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`
                      px-3 py-2
                      ${isGrouped
                        ? isSelf ? 'rounded-lg rounded-tr-md' : 'rounded-lg rounded-tl-md'
                        : 'rounded-lg'
                      }
                      ${isSelf
                        ? 'bg-skin-accent text-skin-inverse'
                        : 'bg-skin-tertiary text-skin-primary'
                      }
                    `}
                  >
                    {/* Only show sender name for non-self messages and non-grouped messages */}
                    {!isSelf && !isGrouped && (
                      <div className="text-xs font-medium text-skin-info mb-1">
                        {msg.playerName}
                      </div>
                    )}

                    {/* Media */}
                    {msg.mediaUrl && (
                      <div className="mb-2">
                        {msg.mediaType === 'gif' || msg.mediaType === 'image' ? (
                          <img
                            src={msg.mediaUrl}
                            alt={msg.mediaAltText || 'Shared media'}
                            className="max-w-full rounded max-h-48 object-contain"
                            loading="lazy"
                          />
                        ) : msg.mediaType === 'link' ? (
                          <a
                            href={msg.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-skin-info underline"
                          >
                            {msg.mediaUrl}
                          </a>
                        ) : null}
                      </div>
                    )}

                    <div className="text-sm break-words">
                      {formatMessage(msg.message)}
                    </div>

                    {/* Link Preview */}
                    {msg.linkPreview && (msg.linkPreview.title || msg.linkPreview.description) && (
                      <a
                        href={msg.linkPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 p-3 bg-skin-tertiary/50 rounded-lg border border-skin-default hover:border-skin-accent transition-colors overflow-hidden"
                      >
                        <div className="flex gap-3">
                          {msg.linkPreview.image && (
                            <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden bg-skin-secondary">
                              <img
                                src={msg.linkPreview.image}
                                alt={msg.linkPreview.title || 'Link preview'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {msg.linkPreview.siteName && (
                              <div className="flex items-center gap-1 text-xs text-skin-muted mb-1">
                                {msg.linkPreview.favicon && (
                                  <img
                                    src={msg.linkPreview.favicon}
                                    alt=""
                                    className="w-3 h-3"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <span>{msg.linkPreview.siteName}</span>
                              </div>
                            )}
                            {msg.linkPreview.title && (
                              <div className="text-sm font-medium text-skin-primary truncate">
                                {msg.linkPreview.title}
                              </div>
                            )}
                            {msg.linkPreview.description && (
                              <div className="text-xs text-skin-muted line-clamp-2 mt-1">
                                {msg.linkPreview.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    )}

                    <div className="flex items-center gap-2 mt-1 text-[10px] opacity-70">
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.isEdited && <span>(edited)</span>}
                      {/* Delivery status for own messages */}
                      {isSelf && (
                        <>
                          <span
                            className={msg.deliveryStatus === 'sending' ? 'text-gray-400' : msg.deliveryStatus === 'failed' ? 'text-red-400' : 'text-green-400'}
                            title={msg.deliveryStatus === 'sending' ? 'Sending...' : msg.deliveryStatus === 'failed' ? 'Failed to send' : 'Delivered'}
                          >
                            {msg.deliveryStatus === 'sending' ? '○' : msg.deliveryStatus === 'failed' ? '✕' : '✓'}
                          </span>
                          {msg.deliveryStatus === 'failed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Create new optimistic message
                                const newTempId = tempIdCounter.current--;
                                const retryMessage: LoungeChatMessage = {
                                  messageId: newTempId,
                                  playerName,
                                  message: msg.message,
                                  timestamp: Date.now(),
                                  replyToId: msg.replyToId || null,
                                  replyTo: msg.replyTo || null,
                                  mediaType: msg.mediaType,
                                  mediaUrl: msg.mediaUrl,
                                  deliveryStatus: 'sending',
                                };
                                // Remove failed message and add retry
                                setMessages(prev => [
                                  ...prev.filter(m => m.messageId !== msg.messageId),
                                  retryMessage,
                                ]);
                                // Resend with same content
                                onSendMessage({
                                  message: msg.message,
                                  replyToId: msg.replyToId || null,
                                  mediaType: msg.mediaType || undefined,
                                  mediaUrl: msg.mediaUrl || undefined,
                                });
                                // Set timeout for retry failure
                                setTimeout(() => {
                                  setMessages(prev => prev.map(m =>
                                    m.messageId === newTempId && m.deliveryStatus === 'sending'
                                      ? { ...m, deliveryStatus: 'failed' }
                                      : m
                                  ));
                                }, 10000);
                              }}
                              className="text-skin-info hover:underline"
                              title="Retry sending"
                            >
                              Retry
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reactions */}
                  {renderReactions(msg)}

                  {/* Action buttons on hover */}
                  {isHovered && (
                    <div
                      className={`absolute top-0 ${isSelf ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} flex items-center gap-1`}
                    >
                      <button
                        onClick={() => setShowReactionPicker(showReactionPicker === msg.messageId ? null : msg.messageId)}
                        className="p-1 rounded bg-skin-tertiary hover:bg-skin-primary text-xs"
                        title="Add reaction"
                      >
                        😊
                      </button>
                      <button
                        onClick={() => handleReply(msg)}
                        className="p-1 rounded bg-skin-tertiary hover:bg-skin-primary text-xs"
                        title="Reply"
                      >
                        ↩
                      </button>
                      {isSelf && (
                        <>
                          <button
                            onClick={() => handleEdit(msg)}
                            className="p-1 rounded bg-skin-tertiary hover:bg-skin-primary text-xs"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(msg.messageId)}
                            className="p-1 rounded bg-skin-tertiary hover:bg-red-500/20 text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Reaction picker - Full emoji picker */}
                  {showReactionPicker === msg.messageId && (
                    <div
                      className={`absolute z-20 ${isSelf ? 'right-0' : 'left-0'} top-full mt-1`}
                    >
                      <EmojiPicker
                        onSelect={(emoji) => handleReaction(msg.messageId, emoji)}
                        onClose={() => setShowReactionPicker(null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button - appears when scrolled up */}
        {!isAtBottom && messages.length > 0 && (
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
                animate-slide-in-up
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
              : typingPlayers.length === 2
              ? `${typingPlayers[0]} and ${typingPlayers[1]} are typing...`
              : `${typingPlayers.length} people are typing...`
            }
          </span>
        </div>
      )}

      {/* Reply/Edit indicator */}
      {(replyingTo || editingMessage) && (
        <div className="px-3 py-2 border-t border-skin-default bg-skin-tertiary/50 flex items-center justify-between">
          <div className="text-xs text-skin-muted">
            {replyingTo && (
              <span>↩ Replying to <strong>{replyingTo.playerName}</strong>: {replyingTo.message.slice(0, 30)}...</span>
            )}
            {editingMessage && (
              <span>✏️ Editing message</span>
            )}
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setInputValue('');
            }}
            className="text-skin-muted hover:text-skin-primary text-xs"
          >
            ✕
          </button>
        </div>
      )}

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
        {/* GIF Picker */}
        {showGifPicker && (
          <GifPicker
            onSelect={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
          />
        )}

        {/* Mention suggestions */}
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

        <div className="relative flex items-center gap-2">
          {/* GIF button */}
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className={`
              p-2 rounded-full transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center
              ${showGifPicker
                ? 'bg-skin-accent text-skin-inverse'
                : 'bg-skin-tertiary hover:bg-skin-primary text-skin-muted hover:text-skin-primary'
              }
            `}
            title="Add GIF"
            aria-label="Add GIF"
          >
            <span className="text-sm font-bold">GIF</span>
          </button>

          {/* Input field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={
                editingMessage
                  ? "Edit your message..."
                  : replyingTo
                  ? `Reply to ${replyingTo.playerName}...`
                  : "Type a message..."
              }
              className="w-full px-4 py-3 rounded-full bg-skin-tertiary text-skin-primary placeholder-skin-muted border border-skin-default focus:border-skin-accent focus:outline-none focus:ring-2 focus:ring-skin-accent/30 text-sm"
              aria-label="Message input"
            />
            {inputValue.length > MAX_MESSAGE_LENGTH * 0.8 && (
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs ${
                inputValue.length >= MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-skin-muted'
              }`}>
                {inputValue.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>

          {/* Send button - visible and accessible on mobile */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() && !editingMessage}
            className={`
              min-w-[44px] min-h-[44px] p-2 rounded-full transition-all flex-shrink-0
              flex items-center justify-center
              ${inputValue.trim() || editingMessage
                ? 'bg-skin-accent text-skin-inverse hover:bg-skin-accent/90 active:scale-95'
                : 'bg-skin-tertiary text-skin-muted cursor-not-allowed'
              }
            `}
            title={editingMessage ? "Save edit" : "Send message"}
            aria-label={editingMessage ? "Save edit" : "Send message"}
          >
            <span className="text-lg">{editingMessage ? '✓' : '➤'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoungeChat;

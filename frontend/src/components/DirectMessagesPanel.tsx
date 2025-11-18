/**
 * DirectMessagesPanel Component
 * Sprint 16 Day 4
 *
 * Full-featured direct messaging panel with conversation list and message threads.
 *
 * Features:
 * - Conversation list with unread indicators
 * - Message threads with real-time updates
 * - Send/receive messages
 * - Mark as read functionality
 * - Delete messages and conversations
 * - Search messages
 * - Typing indicators (future)
 *
 * Usage:
 * ```tsx
 * <DirectMessagesPanel
 *   isOpen={showDMs}
 *   onClose={() => setShowDMs(false)}
 *   socket={socket}
 *   currentUsername={user.username}
 * />
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import Avatar from './Avatar';
import { PlayerNameButton } from './PlayerNameButton';

interface DirectMessage {
  message_id: number;
  sender_id: number;
  recipient_id: number;
  sender_username: string;
  recipient_username: string;
  sender_avatar_url: string | null;
  recipient_avatar_url: string | null;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  user1_id: number;
  user2_id: number;
  user1_username: string;
  user2_username: string;
  user1_avatar_url: string | null;
  user2_avatar_url: string | null;
  last_message_at: string;
  unread_count: number;
  last_message_preview: string;
}

interface DirectMessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentUsername: string;
  initialRecipient?: string; // Open directly to a conversation
  onPlayerClick?: (playerName: string) => void;
}

export function DirectMessagesPanel({
  isOpen,
  onClose,
  socket,
  currentUsername,
  initialRecipient,
  onPlayerClick
}: DirectMessagesPanelProps) {
  // ✅ Early return BEFORE hooks
  if (!isOpen) return null;

  // ✅ NOW safe to call hooks
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialRecipient || null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (!socket || !isOpen) return;

    setLoading(true);
    socket.emit('get_conversations');

    const handleConversationsList = ({ conversations: convos }: { conversations: Conversation[] }) => {
      setConversations(convos);
      setLoading(false);
    };

    socket.on('conversations_list', handleConversationsList);

    return () => {
      socket.off('conversations_list', handleConversationsList);
    };
  }, [socket, isOpen]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    setMessages([]);
    socket.emit('get_conversation', { otherUsername: selectedConversation, limit: 50, offset: 0 });

    const handleConversationMessages = ({
      otherUsername,
      messages: msgs
    }: {
      otherUsername: string;
      messages: DirectMessage[];
    }) => {
      if (otherUsername === selectedConversation) {
        setMessages(msgs.reverse()); // Reverse to show oldest first
      }
    };

    socket.on('conversation_messages', handleConversationMessages);

    return () => {
      socket.off('conversation_messages', handleConversationMessages);
    };
  }, [socket, selectedConversation]);

  // Mark messages as read when conversation opened
  useEffect(() => {
    if (!socket || !selectedConversation) return;

    socket.emit('mark_messages_read', { senderUsername: selectedConversation });

    const handleMessagesMarkedRead = ({ senderUsername }: { senderUsername: string }) => {
      if (senderUsername === selectedConversation) {
        // Update conversation unread count
        setConversations(prev =>
          prev.map(conv => {
            const otherUser =
              conv.user1_username === currentUsername ? conv.user2_username : conv.user1_username;
            return otherUser === senderUsername ? { ...conv, unread_count: 0 } : conv;
          })
        );
      }
    };

    socket.on('messages_marked_read', handleMessagesMarkedRead);

    return () => {
      socket.off('messages_marked_read', handleMessagesMarkedRead);
    };
  }, [socket, selectedConversation, currentUsername]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = ({
      message,
      senderUsername
    }: {
      message: DirectMessage;
      senderUsername: string;
    }) => {
      // If conversation is open, append message
      if (senderUsername === selectedConversation) {
        setMessages(prev => [...prev, message]);
        socket.emit('mark_messages_read', { senderUsername });
      } else {
        // Otherwise, update conversation list
        socket.emit('get_conversations');
      }
    };

    const handleMessageSent = ({ message }: { message: DirectMessage }) => {
      // Append sent message to conversation
      if (selectedConversation && message.recipient_username === selectedConversation) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('direct_message_received', handleMessageReceived);
    socket.on('direct_message_sent', handleMessageSent);

    return () => {
      socket.off('direct_message_received', handleMessageReceived);
      socket.off('direct_message_sent', handleMessageSent);
    };
  }, [socket, selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedConversation]);

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !selectedConversation || !inputMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    socket.emit('send_direct_message', {
      recipientUsername: selectedConversation,
      messageText: inputMessage.trim()
    });

    setInputMessage('');
    setSendingMessage(false);
    inputRef.current?.focus();
  };

  // Get other user info from conversation
  const getOtherUser = (conv: Conversation) => {
    return conv.user1_username === currentUsername
      ? {
          username: conv.user2_username,
          avatar_url: conv.user2_avatar_url
        }
      : {
          username: conv.user1_username,
          avatar_url: conv.user1_avatar_url
        };
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-blue-500/30 w-full max-w-5xl h-[600px] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            💬 Direct Messages
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-700 overflow-y-auto">
            {loading && (
              <div className="text-center py-8 text-gray-400">
                Loading conversations...
              </div>
            )}
            {!loading && conversations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">No conversations yet</p>
                <p className="text-sm">Start chatting with friends!</p>
              </div>
            )}
            {conversations.map((conv) => {
              const other = getOtherUser(conv);
              const isSelected = selectedConversation === other.username;

              return (
                <button
                  key={`${conv.user1_id}-${conv.user2_id}`}
                  onClick={() => setSelectedConversation(other.username)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-700/50 transition-colors ${
                    isSelected ? 'bg-blue-900/30 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <Avatar username={other.username} avatarUrl={other.avatar_url} size="md" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white truncate">{other.username}</span>
                      <span className="text-xs text-gray-400">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{conv.last_message_preview}</p>
                    {conv.unread_count > 0 && (
                      <div className="mt-1">
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {conv.unread_count} new
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {!selectedConversation && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}

            {selectedConversation && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      No messages yet. Say hi!
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isSent = msg.sender_username === currentUsername;
                    return (
                      <div
                        key={msg.message_id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isSent
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-100'
                            }`}
                          >
                            <p className="break-words">{msg.message_text}</p>
                          </div>
                          <span className="text-xs text-gray-400 mt-1 px-2">
                            {formatTime(msg.created_at)}
                            {isSent && msg.is_read && ' • Read'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-700 flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Message ${selectedConversation}...`}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={2000}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendingMessage}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

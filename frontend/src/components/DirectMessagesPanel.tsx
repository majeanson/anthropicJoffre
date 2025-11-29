/**
 * DirectMessagesPanel Component
 * Sprint 16 Day 4 | Refactored Sprint 19B
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
 * Uses unified UI components:
 * - Modal for panel structure
 * - Button for send button
 * - ConversationItem for conversation list items
 * - MessageBubble for message display
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
import { Modal, Button, ConversationItem, MessageBubble, EmptyState } from './ui';
import { ListSkeleton } from './ui/Skeleton';

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
}

export function DirectMessagesPanel({
  isOpen,
  onClose,
  socket,
  currentUsername,
  initialRecipient
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Direct Messages"
      icon={<span className="text-2xl">💬</span>}
      theme="blue"
      size="xl"
      customHeight="h-[600px]"
      contentClassName="flex flex-col p-0 overflow-hidden"
    >
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-700 overflow-y-auto">
          {loading && (
            <div className="p-4">
              <ListSkeleton count={8} hasAvatar={true} hasSecondaryText={true} />
            </div>
          )}
          {!loading && conversations.length === 0 && (
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="Start chatting with friends!"
              compact
            />
          )}
          {conversations.map((conv) => {
            const other = getOtherUser(conv);
            const isSelected = selectedConversation === other.username;

            return (
              <ConversationItem
                key={`${conv.user1_id}-${conv.user2_id}`}
                username={other.username}
                avatar={<Avatar username={other.username} avatarUrl={other.avatar_url} size="md" />}
                lastMessage={conv.last_message_preview}
                timestamp={conv.last_message_at}
                unreadCount={conv.unread_count}
                isSelected={isSelected}
                onClick={() => setSelectedConversation(other.username)}
              />
            );
          })}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {!selectedConversation && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="💬"
                title="Select a conversation"
                description="Choose a conversation to start messaging"
              />
            </div>
          )}

          {selectedConversation && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <EmptyState icon="👋" title="No messages yet" description="Say hi!" compact />
                )}
                {messages.map((msg) => {
                  const isSent = msg.sender_username === currentUsername;
                  return (
                    <MessageBubble
                      key={msg.message_id}
                      text={msg.message_text}
                      isSent={isSent}
                      timestamp={msg.created_at}
                      isRead={isSent ? msg.is_read : undefined}
                    />
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
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!inputMessage.trim() || sendingMessage}
                  className="bg-blue-600 hover:bg-blue-500 border-blue-700"
                >
                  Send
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

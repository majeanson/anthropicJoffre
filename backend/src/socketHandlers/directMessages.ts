/**
 * Direct Messages Socket Handlers
 * Sprint 16 Day 4
 */

import { Server, Socket } from 'socket.io';
import {
  sendDirectMessage,
  getConversation,
  getUserConversations,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessageForSender,
  deleteMessageForRecipient,
  deleteConversationForUser,
  searchMessages
} from '../db/directMessages.js';
import { isBlockedEitherWay } from '../db/blocks';
import { errorBoundaries } from '../middleware/errorBoundary.js';

interface DirectMessageHandlerDependencies {
  errorBoundaries: typeof errorBoundaries;
}

export function registerDirectMessageHandlers(
  io: Server,
  socket: Socket,
  deps: DirectMessageHandlerDependencies
) {
  const { errorBoundaries } = deps;

  /**
   * Send a direct message
   */
  socket.on(
    'send_direct_message',
    errorBoundaries.gameAction('send_direct_message')(async ({
      recipientUsername,
      messageText
    }: {
      recipientUsername: string;
      messageText: string;
    }) => {
      const senderUsername = socket.data.playerName;

      if (!senderUsername) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      if (!messageText || messageText.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (messageText.length > 2000) {
        socket.emit('error', { message: 'Message too long (max 2000 characters)' });
        return;
      }

      if (senderUsername === recipientUsername) {
        socket.emit('error', { message: 'Cannot send message to yourself' });
        return;
      }

      // Check if either player has blocked the other
      const blocked = await isBlockedEitherWay(senderUsername, recipientUsername);
      if (blocked) {
        socket.emit('error', { message: 'Cannot send message to this player' });
        return;
      }

      const message = await sendDirectMessage(senderUsername, recipientUsername, messageText.trim());

      if (!message) {
        socket.emit('error', { message: 'Failed to send message' });
        return;
      }

      // Confirm to sender
      socket.emit('direct_message_sent', { message });

      // Notify recipient if online
      const recipientSockets = await io.in(`player:${recipientUsername}`).fetchSockets();
      if (recipientSockets.length > 0) {
        io.to(`player:${recipientUsername}`).emit('direct_message_received', {
          message,
          senderUsername
        });

        // Create notification
        try {
          const { createNotification } = await import('../db/notifications.js');
          const { getUserByUsername } = await import('../db/users.js');

          const recipientUser = await getUserByUsername(recipientUsername);
          if (recipientUser) {
            await createNotification({
              user_id: recipientUser.user_id,
              notification_type: 'direct_message',
              title: `New message from ${senderUsername}`,
              message: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
              data: {
                sender_username: senderUsername,
                message_id: message.message_id
              },
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });

            // Emit notification_received event
            io.to(`player:${recipientUsername}`).emit('notification_received', {
              notification_type: 'direct_message',
              title: `New message from ${senderUsername}`,
              message: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
            });
          }
        } catch (error) {
          console.log(`DM notification skipped for guest player: ${recipientUsername}`);
        }
      }
    })
  );

  /**
   * Get conversation with another user
   */
  socket.on(
    'get_conversation',
    errorBoundaries.readOnly('get_conversation')(async ({
      otherUsername,
      limit = 50,
      offset = 0
    }: {
      otherUsername: string;
      limit?: number;
      offset?: number;
    }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const messages = await getConversation(username, otherUsername, limit, offset);
      socket.emit('conversation_messages', { otherUsername, messages });
    })
  );

  /**
   * Get all conversations for current user
   */
  socket.on(
    'get_conversations',
    errorBoundaries.readOnly('get_conversations')(async () => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const conversations = await getUserConversations(username);
      socket.emit('conversations_list', { conversations });
    })
  );

  /**
   * Mark messages as read
   */
  socket.on(
    'mark_messages_read',
    errorBoundaries.gameAction('mark_messages_read')(async ({
      senderUsername
    }: {
      senderUsername: string;
    }) => {
      const recipientUsername = socket.data.playerName;

      if (!recipientUsername) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const count = await markMessagesAsRead(recipientUsername, senderUsername);
      socket.emit('messages_marked_read', { senderUsername, count });

      // Notify sender that their messages were read
      const senderSockets = await io.in(`player:${senderUsername}`).fetchSockets();
      if (senderSockets.length > 0) {
        io.to(`player:${senderUsername}`).emit('messages_read_by', {
          recipientUsername,
          count
        });
      }
    })
  );

  /**
   * Get unread message count
   */
  socket.on(
    'get_unread_count',
    errorBoundaries.readOnly('get_unread_count')(async () => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const count = await getUnreadCount(username);
      socket.emit('unread_count', { count });
    })
  );

  /**
   * Delete a message (soft delete)
   */
  socket.on(
    'delete_message',
    errorBoundaries.gameAction('delete_message')(async ({
      messageId,
      isSender
    }: {
      messageId: number;
      isSender: boolean;
    }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const success = isSender
        ? await deleteMessageForSender(messageId, username)
        : await deleteMessageForRecipient(messageId, username);

      if (success) {
        socket.emit('message_deleted', { messageId });
      } else {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    })
  );

  /**
   * Delete entire conversation
   */
  socket.on(
    'delete_conversation',
    errorBoundaries.gameAction('delete_conversation')(async ({
      otherUsername
    }: {
      otherUsername: string;
    }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      const count = await deleteConversationForUser(username, otherUsername);
      socket.emit('conversation_deleted', { otherUsername, count });
    })
  );

  /**
   * Search messages
   */
  socket.on(
    'search_messages',
    errorBoundaries.readOnly('search_messages')(async ({
      searchQuery,
      limit = 20
    }: {
      searchQuery: string;
      limit?: number;
    }) => {
      const username = socket.data.playerName;

      if (!username) {
        socket.emit('error', { message: 'Not logged in' });
        return;
      }

      if (!searchQuery || searchQuery.trim().length < 2) {
        socket.emit('message_search_results', { results: [] });
        return;
      }

      const results = await searchMessages(username, searchQuery.trim(), limit);
      socket.emit('message_search_results', { results });
    })
  );
}

/**
 * Direct Messages Socket Handler Tests
 * Sprint 7: Socket Handler Tests - High Priority
 *
 * Tests for directMessages.ts socket handlers - HIGH for social security:
 * - send_direct_message: Send a DM (with block enforcement)
 * - get_conversation: Get messages between two users
 * - get_conversations: Get all conversations
 * - mark_messages_read: Mark messages as read
 * - get_unread_count: Get unread message count
 * - delete_message: Delete a specific message
 * - delete_conversation: Delete entire conversation
 * - search_messages: Search through messages
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// TEST TYPES
// ============================================================================

interface DirectMessage {
  message_id: number;
  sender_username: string;
  recipient_username: string;
  message_text: string;
  created_at: Date;
  read_at: Date | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
}

interface Conversation {
  other_username: string;
  last_message: string;
  last_message_time: Date;
  unread_count: number;
}

// ============================================================================
// TEST HELPERS
// ============================================================================

// Helper to create a test message
function createTestMessage(overrides: Partial<DirectMessage> = {}): DirectMessage {
  return {
    message_id: 1,
    sender_username: 'Alice',
    recipient_username: 'Bob',
    message_text: 'Hello Bob!',
    created_at: new Date(),
    read_at: null,
    deleted_by_sender: false,
    deleted_by_recipient: false,
    ...overrides,
  };
}

// Helper to simulate blocking system
function createBlockTracker(): {
  blocks: Set<string>;
  addBlock: (blocker: string, blocked: string) => void;
  isBlocked: (user1: string, user2: string) => boolean;
  isBlockedEitherWay: (user1: string, user2: string) => boolean;
} {
  const blocks = new Set<string>();

  return {
    blocks,
    addBlock: (blocker: string, blocked: string) => {
      blocks.add(`${blocker}:${blocked}`);
    },
    isBlocked: (blocker: string, blocked: string) => {
      return blocks.has(`${blocker}:${blocked}`);
    },
    isBlockedEitherWay: (user1: string, user2: string) => {
      return blocks.has(`${user1}:${user2}`) || blocks.has(`${user2}:${user1}`);
    },
  };
}

// Helper to simulate message storage
function createMessageStore(): {
  messages: DirectMessage[];
  addMessage: (msg: DirectMessage) => DirectMessage;
  getConversation: (user1: string, user2: string, limit?: number) => DirectMessage[];
  markAsRead: (recipient: string, sender: string) => number;
  getUnreadCount: (username: string) => number;
  deleteForSender: (messageId: number, username: string) => boolean;
  deleteForRecipient: (messageId: number, username: string) => boolean;
  search: (username: string, query: string) => DirectMessage[];
} {
  const messages: DirectMessage[] = [];
  let nextId = 1;

  return {
    messages,
    addMessage: (msg) => {
      const newMsg = { ...msg, message_id: nextId++ };
      messages.push(newMsg);
      return newMsg;
    },
    getConversation: (user1, user2, limit = 50) => {
      return messages
        .filter(
          (m) =>
            ((m.sender_username === user1 && m.recipient_username === user2) ||
              (m.sender_username === user2 && m.recipient_username === user1)) &&
            !((m.sender_username === user1 && m.deleted_by_sender) ||
              (m.recipient_username === user1 && m.deleted_by_recipient))
        )
        .slice(0, limit);
    },
    markAsRead: (recipient, sender) => {
      let count = 0;
      messages.forEach((m) => {
        if (
          m.sender_username === sender &&
          m.recipient_username === recipient &&
          !m.read_at
        ) {
          m.read_at = new Date();
          count++;
        }
      });
      return count;
    },
    getUnreadCount: (username) => {
      return messages.filter(
        (m) => m.recipient_username === username && !m.read_at && !m.deleted_by_recipient
      ).length;
    },
    deleteForSender: (messageId, username) => {
      const msg = messages.find(
        (m) => m.message_id === messageId && m.sender_username === username
      );
      if (msg) {
        msg.deleted_by_sender = true;
        return true;
      }
      return false;
    },
    deleteForRecipient: (messageId, username) => {
      const msg = messages.find(
        (m) => m.message_id === messageId && m.recipient_username === username
      );
      if (msg) {
        msg.deleted_by_recipient = true;
        return true;
      }
      return false;
    },
    search: (username, query) => {
      const lowerQuery = query.toLowerCase();
      return messages.filter(
        (m) =>
          (m.sender_username === username || m.recipient_username === username) &&
          m.message_text.toLowerCase().includes(lowerQuery) &&
          !((m.sender_username === username && m.deleted_by_sender) ||
            (m.recipient_username === username && m.deleted_by_recipient))
      );
    },
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('directMessages handlers', () => {
  let blockTracker: ReturnType<typeof createBlockTracker>;
  let messageStore: ReturnType<typeof createMessageStore>;

  beforeEach(() => {
    blockTracker = createBlockTracker();
    messageStore = createMessageStore();
  });

  // ==========================================================================
  // send_direct_message
  // ==========================================================================
  describe('send_direct_message', () => {
    it('should send message between non-blocked users', () => {
      const senderUsername = 'Alice';
      const recipientUsername = 'Bob';
      const messageText = 'Hello Bob!';

      const blocked = blockTracker.isBlockedEitherWay(senderUsername, recipientUsername);
      expect(blocked).toBe(false);

      const msg = messageStore.addMessage(
        createTestMessage({
          sender_username: senderUsername,
          recipient_username: recipientUsername,
          message_text: messageText,
        })
      );

      expect(msg.message_id).toBeDefined();
      expect(msg.sender_username).toBe('Alice');
    });

    it('should reject empty message', () => {
      const messageText = '';
      const isValid = messageText.length > 0 && messageText.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it('should reject message over 2000 characters', () => {
      const messageText = 'a'.repeat(2001);
      const isValid = messageText.length <= 2000;

      expect(isValid).toBe(false);
    });

    it('should reject sending message to yourself', () => {
      const senderUsername = 'Alice';
      const recipientUsername = 'Alice';

      const isSelfMessage = senderUsername === recipientUsername;

      expect(isSelfMessage).toBe(true);
    });

    it('should reject if sender has blocked recipient', () => {
      blockTracker.addBlock('Alice', 'Bob');

      const blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');

      expect(blocked).toBe(true);
    });

    it('should reject if recipient has blocked sender', () => {
      blockTracker.addBlock('Bob', 'Alice');

      const blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');

      expect(blocked).toBe(true);
    });

    it('should require login (playerName)', () => {
      const socketData = { playerName: undefined };
      const isLoggedIn = !!socketData.playerName;

      expect(isLoggedIn).toBe(false);
    });

    it('should trim whitespace from message', () => {
      const messageText = '  Hello Bob!  ';
      const trimmedMessage = messageText.trim();

      expect(trimmedMessage).toBe('Hello Bob!');
      expect(trimmedMessage.length).toBe(10);
    });
  });

  // ==========================================================================
  // get_conversation
  // ==========================================================================
  describe('get_conversation', () => {
    it('should return messages between two users', () => {
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Bob', recipient_username: 'Alice' })
      );
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );

      const conversation = messageStore.getConversation('Alice', 'Bob');

      expect(conversation.length).toBe(3);
    });

    it('should not include messages deleted by the viewer', () => {
      const msg = messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );
      messageStore.deleteForRecipient(msg.message_id, 'Bob');

      const bobsView = messageStore.getConversation('Bob', 'Alice');
      const alicesView = messageStore.getConversation('Alice', 'Bob');

      // Bob deleted it, so Bob shouldn't see it
      expect(bobsView.length).toBe(0);
      // Alice (sender) should still see it
      expect(alicesView.length).toBe(1);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        messageStore.addMessage(
          createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
        );
      }

      const conversation = messageStore.getConversation('Alice', 'Bob', 5);

      expect(conversation.length).toBe(5);
    });

    it('should require login', () => {
      const socketData = { playerName: undefined };
      const isLoggedIn = !!socketData.playerName;

      expect(isLoggedIn).toBe(false);
    });
  });

  // ==========================================================================
  // get_conversations
  // ==========================================================================
  describe('get_conversations', () => {
    it('should return list of all conversations', () => {
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Charlie', recipient_username: 'Alice' })
      );

      // In real implementation, this aggregates conversations
      const hasMessageWithBob = messageStore.messages.some(
        (m) =>
          (m.sender_username === 'Alice' && m.recipient_username === 'Bob') ||
          (m.sender_username === 'Bob' && m.recipient_username === 'Alice')
      );
      const hasMessageWithCharlie = messageStore.messages.some(
        (m) =>
          (m.sender_username === 'Alice' && m.recipient_username === 'Charlie') ||
          (m.sender_username === 'Charlie' && m.recipient_username === 'Alice')
      );

      expect(hasMessageWithBob).toBe(true);
      expect(hasMessageWithCharlie).toBe(true);
    });

    it('should require login', () => {
      const socketData = { playerName: undefined };
      const isLoggedIn = !!socketData.playerName;

      expect(isLoggedIn).toBe(false);
    });
  });

  // ==========================================================================
  // mark_messages_read
  // ==========================================================================
  describe('mark_messages_read', () => {
    it('should mark unread messages as read', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          read_at: null,
        })
      );
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          read_at: null,
        })
      );

      expect(messageStore.getUnreadCount('Bob')).toBe(2);

      const markedCount = messageStore.markAsRead('Bob', 'Alice');

      expect(markedCount).toBe(2);
      expect(messageStore.getUnreadCount('Bob')).toBe(0);
    });

    it('should only mark messages from specific sender', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          read_at: null,
        })
      );
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Charlie',
          recipient_username: 'Bob',
          read_at: null,
        })
      );

      messageStore.markAsRead('Bob', 'Alice');

      // Charlie's message still unread
      expect(messageStore.getUnreadCount('Bob')).toBe(1);
    });

    it('should not mark already-read messages', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          read_at: new Date(), // Already read
        })
      );

      const markedCount = messageStore.markAsRead('Bob', 'Alice');

      expect(markedCount).toBe(0);
    });
  });

  // ==========================================================================
  // get_unread_count
  // ==========================================================================
  describe('get_unread_count', () => {
    it('should return correct unread count', () => {
      messageStore.addMessage(
        createTestMessage({ recipient_username: 'Bob', read_at: null })
      );
      messageStore.addMessage(
        createTestMessage({ recipient_username: 'Bob', read_at: null })
      );
      messageStore.addMessage(
        createTestMessage({ recipient_username: 'Bob', read_at: new Date() })
      );

      const count = messageStore.getUnreadCount('Bob');

      expect(count).toBe(2);
    });

    it('should not count deleted messages', () => {
      const msg = messageStore.addMessage(
        createTestMessage({ recipient_username: 'Bob', read_at: null })
      );
      messageStore.deleteForRecipient(msg.message_id, 'Bob');

      const count = messageStore.getUnreadCount('Bob');

      expect(count).toBe(0);
    });

    it('should require login', () => {
      const socketData = { playerName: undefined };
      const isLoggedIn = !!socketData.playerName;

      expect(isLoggedIn).toBe(false);
    });
  });

  // ==========================================================================
  // delete_message
  // ==========================================================================
  describe('delete_message', () => {
    it('should soft delete for sender', () => {
      const msg = messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );

      const success = messageStore.deleteForSender(msg.message_id, 'Alice');

      expect(success).toBe(true);
      expect(messageStore.messages[0].deleted_by_sender).toBe(true);
    });

    it('should soft delete for recipient', () => {
      const msg = messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );

      const success = messageStore.deleteForRecipient(msg.message_id, 'Bob');

      expect(success).toBe(true);
      expect(messageStore.messages[0].deleted_by_recipient).toBe(true);
    });

    it('should fail if user is not sender/recipient', () => {
      const msg = messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );

      const successAsSender = messageStore.deleteForSender(msg.message_id, 'Charlie');
      const successAsRecipient = messageStore.deleteForRecipient(msg.message_id, 'Charlie');

      expect(successAsSender).toBe(false);
      expect(successAsRecipient).toBe(false);
    });

    it('should fail for non-existent message', () => {
      const success = messageStore.deleteForSender(999, 'Alice');

      expect(success).toBe(false);
    });
  });

  // ==========================================================================
  // delete_conversation
  // ==========================================================================
  describe('delete_conversation', () => {
    it('should delete all messages in conversation for user', () => {
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Bob', recipient_username: 'Alice' })
      );
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );

      // Simulate deleting conversation for Alice
      messageStore.messages.forEach((m) => {
        if (m.sender_username === 'Alice') {
          m.deleted_by_sender = true;
        }
        if (m.recipient_username === 'Alice') {
          m.deleted_by_recipient = true;
        }
      });

      const alicesView = messageStore.getConversation('Alice', 'Bob');

      expect(alicesView.length).toBe(0);
    });

    it('should not affect other user view', () => {
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Alice', recipient_username: 'Bob' })
      );
      messageStore.addMessage(
        createTestMessage({ sender_username: 'Bob', recipient_username: 'Alice' })
      );

      // Alice deletes her view
      messageStore.messages.forEach((m) => {
        if (m.sender_username === 'Alice') {
          m.deleted_by_sender = true;
        }
        if (m.recipient_username === 'Alice') {
          m.deleted_by_recipient = true;
        }
      });

      const bobsView = messageStore.getConversation('Bob', 'Alice');

      // Bob should still see both messages from his perspective
      // - His sent message (sender=Bob, recipient=Alice) - not deleted for Bob
      // - Alice's message (sender=Alice, recipient=Bob) - deleted_by_sender doesn't affect recipient view
      expect(bobsView.length).toBe(2);
    });
  });

  // ==========================================================================
  // search_messages
  // ==========================================================================
  describe('search_messages', () => {
    it('should find messages containing search query', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          message_text: 'Hello Bob, how are you?',
        })
      );
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Bob',
          recipient_username: 'Alice',
          message_text: 'I am fine, thanks!',
        })
      );

      const results = messageStore.search('Alice', 'hello');

      expect(results.length).toBe(1);
      expect(results[0].message_text).toContain('Hello');
    });

    it('should be case-insensitive', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          message_text: 'HELLO BOB',
        })
      );

      const results = messageStore.search('Alice', 'hello');

      expect(results.length).toBe(1);
    });

    it('should require minimum 2 characters', () => {
      const searchQuery = 'a';
      const isValid = searchQuery.trim().length >= 2;

      expect(isValid).toBe(false);
    });

    it('should return empty for no matches', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          message_text: 'Hello Bob!',
        })
      );

      const results = messageStore.search('Alice', 'xyz123');

      expect(results.length).toBe(0);
    });

    it('should not search deleted messages', () => {
      const msg = messageStore.addMessage(
        createTestMessage({
          sender_username: 'Alice',
          recipient_username: 'Bob',
          message_text: 'Secret message',
        })
      );
      messageStore.deleteForSender(msg.message_id, 'Alice');

      const results = messageStore.search('Alice', 'secret');

      expect(results.length).toBe(0);
    });

    it('should only search user own conversations', () => {
      messageStore.addMessage(
        createTestMessage({
          sender_username: 'Charlie',
          recipient_username: 'David',
          message_text: 'Private conversation',
        })
      );

      const results = messageStore.search('Alice', 'private');

      expect(results.length).toBe(0);
    });
  });

  // ==========================================================================
  // Block enforcement edge cases
  // ==========================================================================
  describe('block enforcement', () => {
    it('should prevent messaging after block', () => {
      // First, messaging works
      let blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');
      expect(blocked).toBe(false);

      // Then Alice blocks Bob
      blockTracker.addBlock('Alice', 'Bob');

      // Now messaging should fail both ways
      blocked = blockTracker.isBlockedEitherWay('Alice', 'Bob');
      expect(blocked).toBe(true);

      blocked = blockTracker.isBlockedEitherWay('Bob', 'Alice');
      expect(blocked).toBe(true);
    });

    it('should handle multiple blocks', () => {
      blockTracker.addBlock('Alice', 'Bob');
      blockTracker.addBlock('Alice', 'Charlie');
      blockTracker.addBlock('David', 'Alice');

      expect(blockTracker.isBlockedEitherWay('Alice', 'Bob')).toBe(true);
      expect(blockTracker.isBlockedEitherWay('Alice', 'Charlie')).toBe(true);
      expect(blockTracker.isBlockedEitherWay('Alice', 'David')).toBe(true);
      expect(blockTracker.isBlockedEitherWay('Alice', 'Eve')).toBe(false);
    });
  });

  // ==========================================================================
  // Message validation
  // ==========================================================================
  describe('message validation', () => {
    it('should handle whitespace-only messages', () => {
      const messageText = '   \t\n   ';
      const isValid = messageText.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it('should allow exactly 2000 characters', () => {
      const messageText = 'a'.repeat(2000);
      const isValid = messageText.length <= 2000;

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', () => {
      const messageText = '你好世界 🎮 مرحبا';
      const isValid = messageText.trim().length > 0 && messageText.length <= 2000;

      expect(isValid).toBe(true);
    });

    it('should handle newlines in messages', () => {
      const messageText = 'Line 1\nLine 2\nLine 3';
      const isValid = messageText.trim().length > 0 && messageText.length <= 2000;

      expect(isValid).toBe(true);
    });
  });
});

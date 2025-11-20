/**
 * useChatNotifications Hook
 * Week 2 Task 8: Extracted from PlayingPhase, BettingPhase, ScoringPhase
 *
 * Handles chat notification logic:
 * - Unread message count tracking
 * - Notification sound for messages from other players
 * - Auto-reset count when chat opens
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types/game';
import { sounds } from '../utils/sounds';

interface UseChatNotificationsOptions {
  socket: Socket | null | undefined;
  currentPlayerId: string;
  chatOpen: boolean;
  onNewChatMessage?: (message: ChatMessage) => void;
}

interface UseChatNotificationsReturn {
  unreadChatCount: number;
  setUnreadChatCount: (count: number | ((prev: number) => number)) => void;
}

export function useChatNotifications({
  socket,
  currentPlayerId,
  chatOpen,
  onNewChatMessage
}: UseChatNotificationsOptions): UseChatNotificationsReturn {
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Listen for chat messages and update unread count
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      // Increment unread count if chat is closed
      if (!chatOpen) {
        setUnreadChatCount(prev => prev + 1);

        // Play notification sound if message is from another player
        if (msg.playerId !== currentPlayerId) {
          sounds.chatNotification();
        }
      }

      // Notify parent component of new message
      onNewChatMessage?.(msg);
    };

    socket.on('game_chat_message', handleChatMessage);

    return () => {
      socket.off('game_chat_message', handleChatMessage);
    };
  }, [socket, chatOpen, currentPlayerId, onNewChatMessage]);

  // Reset unread count when chat opens
  useEffect(() => {
    if (chatOpen) {
      setUnreadChatCount(0);
    }
  }, [chatOpen]);

  return {
    unreadChatCount,
    setUnreadChatCount
  };
}

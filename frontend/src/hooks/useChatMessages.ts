/**
 * Chat Messages Hook
 * Sprint 5 Phase 1: Extracted from App.tsx
 *
 * Manages chat message state and Socket.io listeners for:
 * - Team selection chat
 * - In-game chat
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types/game';

interface UseChatMessagesProps {
  socket: Socket | null;
}

/**
 * Chat messages management hook with Socket.io event listeners
 *
 * Handles chat-related socket events and message state
 *
 * @param socket - Socket.io instance
 * @returns Chat messages state and setter function
 */
export function useChatMessages({ socket }: UseChatMessagesProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Team Selection Chat Event
    const handleTeamSelectionChat = (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    };

    // In-Game Chat Event
    const handleGameChat = (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    };

    // Register event listeners
    socket.on('team_selection_chat', handleTeamSelectionChat);
    socket.on('game_chat', handleGameChat);

    // Cleanup function
    return () => {
      socket.off('team_selection_chat', handleTeamSelectionChat);
      socket.off('game_chat', handleGameChat);
    };
  }, [socket]);

  return {
    chatMessages,
    setChatMessages,
  };
}

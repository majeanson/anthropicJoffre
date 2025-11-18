/**
 * Lobby Chat Hook
 * Sprint 16 Task 4.2: Refactoring to support UnifiedChat
 *
 * Manages lobby chat messages and Socket.io listeners
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types/game';

interface UseLobbyChatProps {
  socket: Socket | null;
  playerName: string;
}

/**
 * Lobby chat management hook with Socket.io event listeners
 *
 * @param socket - Socket.io instance
 * @param playerName - Current player name
 * @returns Chat messages and send function
 */
export function useLobbyChat({ socket, playerName }: UseLobbyChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Request chat history from server
    socket.emit('get_lobby_chat', 100);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Handle chat history response
    const handleChatHistory = (data: { messages: Array<{ playerName: string; message: string; createdAt: string }> }) => {
      // Convert database messages to ChatMessage format
      const historicalMessages: ChatMessage[] = data.messages.map(msg => ({
        playerId: msg.playerName, // Use playerName as ID for lobby
        playerName: msg.playerName,
        message: msg.message,
        timestamp: new Date(msg.createdAt).getTime(),
        teamId: null, // No teams in lobby
      }));
      setMessages(historicalMessages);
    };

    // Handle incoming lobby chat messages
    const handleLobbyChatMessage = (data: { playerName: string; message: string; timestamp: number }) => {
      const newMessage: ChatMessage = {
        playerId: data.playerName, // Use playerName as ID for lobby
        playerName: data.playerName,
        message: data.message,
        timestamp: data.timestamp,
        teamId: null, // No teams in lobby
      };
      setMessages(prev => [...prev, newMessage]);
    };

    // Register event listeners
    socket.on('lobby_chat_history', handleChatHistory);
    socket.on('lobby_chat_message', handleLobbyChatMessage);

    // Cleanup function
    return () => {
      socket.off('lobby_chat_history', handleChatHistory);
      socket.off('lobby_chat_message', handleLobbyChatMessage);
    };
  }, [socket]);

  // Send message function
  const sendMessage = (message: string) => {
    if (!socket || !message.trim()) return;

    // Prompt for name if not set
    if (!playerName.trim()) {
      const name = window.prompt('Please enter your name to chat:');
      if (!name || !name.trim()) return;
      // Note: This would need to be handled by parent component
      // For now we just return
      return;
    }

    socket.emit('send_lobby_chat', {
      playerName: playerName.trim(),
      message: message.trim(),
    });
  };

  return {
    messages,
    sendMessage,
  };
}
/**
 * Lobby Chat Component
 *
 * Global chat for all players in the lobby (social section)
 * Allows players to communicate before joining games
 */

import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface LobbyChatMessage {
  playerName: string;
  message: string;
  timestamp: number;
}

interface LobbyChatProps {
  socket: Socket | null;
  playerName: string;
  onSetPlayerName?: (name: string) => void;
}

export function LobbyChat({ socket, playerName, onSetPlayerName }: LobbyChatProps) {
  const [messages, setMessages] = useState<LobbyChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for incoming lobby chat messages
  useEffect(() => {
    if (!socket) return;

    const handleLobbyChatMessage = (data: LobbyChatMessage) => {
      setMessages(prev => [...prev, data]);
    };

    socket.on('lobby_chat_message', handleLobbyChatMessage);

    return () => {
      socket.off('lobby_chat_message', handleLobbyChatMessage);
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socket || !inputMessage.trim()) {
      return;
    }

    // Prompt for name if not set
    if (!playerName.trim()) {
      const name = window.prompt('Please enter your name to chat:');
      if (name && name.trim() && onSetPlayerName) {
        onSetPlayerName(name.trim());
        // After setting name, retry sending the message
        socket.emit('send_lobby_chat', {
          playerName: name.trim(),
          message: inputMessage.trim(),
        });
        setInputMessage('');
      }
      return;
    }

    // Send message to server (no 'Anonymous' fallback)
    socket.emit('send_lobby_chat', {
      playerName: playerName.trim(),
      message: inputMessage.trim(),
    });

    setInputMessage('');
  };

  const handleInputFocus = () => {
    // Prompt for name when focusing input if not set
    if (!playerName.trim() && onSetPlayerName) {
      const name = window.prompt('Please enter your name to chat:');
      if (name && name.trim()) {
        onSetPlayerName(name.trim());
      }
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-col h-[400px] bg-parchment-50 dark:bg-gray-800 rounded-lg border-2 border-parchment-400 dark:border-gray-600">
      {/* Header */}
      <div className="px-4 py-3 bg-parchment-100 dark:bg-gray-700 border-b-2 border-parchment-400 dark:border-gray-600 rounded-t-lg">
        <h3 className="font-bold text-umber-900 dark:text-gray-100 text-lg">💬 Lobby Chat</h3>
        <p className="text-xs text-umber-600 dark:text-gray-400">Chat with other players in the lobby</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-umber-600 dark:text-gray-400 py-8">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.playerName === playerName;
            return (
              <div
                key={index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-500 text-white'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-900 dark:text-gray-100'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm">{msg.playerName}</span>
                    <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-umber-600 dark:text-gray-400'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-parchment-400 dark:border-gray-600 bg-parchment-50 dark:bg-gray-800 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={playerName.trim() ? "Type a message..." : "Click to enter your name..."}
            maxLength={200}
            className="flex-1 px-3 py-2 border-2 border-parchment-400 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-umber-900 dark:text-gray-100 placeholder-umber-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
          >
            Send
          </button>
        </div>
        {!playerName.trim() && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            💬 Click the input above to set your name and start chatting
          </p>
        )}
      </form>
    </div>
  );
}

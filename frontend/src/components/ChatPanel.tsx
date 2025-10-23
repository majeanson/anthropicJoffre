import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types/game';

interface ChatPanelProps {
  socket: Socket | null;
  gameId: string;
  currentPlayerId: string;
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
}

export function ChatPanel({ socket, gameId, currentPlayerId, isOpen, onClose, messages, onNewMessage }: ChatPanelProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      onNewMessage(msg);
    };

    socket.on('game_chat_message', handleChatMessage);

    return () => {
      socket.off('game_chat_message', handleChatMessage);
    };
  }, [socket, onNewMessage]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputMessage.trim()) return;

    socket.emit('send_game_chat', {
      gameId,
      message: inputMessage.trim()
    });

    setInputMessage('');
    inputRef.current?.focus();
  };

  const quickEmojis = ['👍', '👎', '🔥', '😂', 'GG'];

  const handleQuickEmoji = (emoji: string) => {
    if (!socket) return;

    socket.emit('send_game_chat', {
      gameId,
      message: emoji
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-80 bg-parchment-50 dark:bg-gray-800 rounded-lg shadow-2xl border-4 border-amber-700 dark:border-gray-600 flex flex-col max-h-96 z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-800 dark:from-gray-700 dark:to-gray-900 text-parchment-50 dark:text-gray-100 px-4 py-3 rounded-t-md flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          💬 Chat
        </h3>
        <button
          onClick={onClose}
          className="text-parchment-50 hover:text-parchment-200 text-xl font-bold leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-parchment-100 dark:bg-gray-700 min-h-[200px] max-h-[250px]">
        {messages.length === 0 ? (
          <p className="text-sm text-umber-500 text-center py-4">No messages yet. Say something!</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.timestamp}-${idx}`}
                className={`p-2 rounded text-sm ${
                  msg.teamId === 1
                    ? 'bg-orange-100 dark:bg-orange-900/40 border-l-4 border-orange-400 dark:border-orange-600'
                    : msg.teamId === 2
                    ? 'bg-purple-100 dark:bg-purple-900/40 border-l-4 border-purple-400 dark:border-purple-600'
                    : 'bg-parchment-200 dark:bg-gray-600 border-l-4 border-parchment-400 dark:border-gray-600'
                }`}
              >
                <div className="font-bold text-umber-900 dark:text-gray-100 text-xs">
                  {msg.playerName}
                  {msg.playerId === currentPlayerId && ' (You)'}
                </div>
                <div className="text-umber-800 dark:text-gray-200 mt-0.5">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Emojis */}
      <div className="px-3 py-2 bg-parchment-100 dark:bg-gray-700 border-t border-parchment-300 dark:border-gray-600 flex gap-1">
        {quickEmojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="text-lg hover:bg-parchment-200 dark:bg-gray-600 rounded px-2 py-1 transition-colors"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-parchment-100 dark:bg-gray-700 border-t border-parchment-300 dark:border-gray-600 rounded-b-md">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message... (max 200 chars)"
            maxLength={200}
            className="flex-1 px-3 py-2 border-2 border-parchment-400 dark:border-gray-600 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-50 dark:bg-gray-800 text-umber-900 dark:text-gray-100 text-sm"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 border-2 border-blue-800 disabled:border-gray-600 shadow-sm text-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// Chat toggle button component
interface ChatToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount: number;
}

export function ChatToggleButton({ isOpen, onClick, unreadCount }: ChatToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center gap-2 relative"
      title="Toggle chat"
    >
      <span>💬</span>
      <span>{isOpen ? 'Close Chat' : 'Chat'}</span>
      {unreadCount > 0 && !isOpen && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage } from '../types/game';

interface FloatingTeamChatProps {
  gameId: string;
  socket: Socket | null;
  messages: ChatMessage[];
  currentPlayerId: string;
  currentPlayerTeamId?: 1 | 2; // Reserved for future use
}

export function FloatingTeamChat({
  gameId,
  socket,
  messages,
  currentPlayerId,
  currentPlayerTeamId: _currentPlayerTeamId
}: FloatingTeamChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update unread count when collapsed
  useEffect(() => {
    if (!isExpanded && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.playerId !== currentPlayerId) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, isExpanded, currentPlayerId]);

  // Reset unread count when expanded
  useEffect(() => {
    if (isExpanded) {
      setUnreadCount(0);
    }
  }, [isExpanded]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputMessage.trim()) return;

    socket.emit('send_team_selection_chat', {
      gameId,
      message: inputMessage.trim()
    });

    setInputMessage('');
    inputRef.current?.focus();
  };

  const toggleChat = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 z-40"
        data-testid="floating-chat-button"
      >
        <span className="text-xl">💬</span>
        <span className="font-semibold">Chat</span>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] bg-parchment-50 dark:bg-gray-800 border-2 border-amber-700 dark:border-gray-600 rounded-lg shadow-2xl z-40 flex flex-col animate-slide-in"
      data-testid="floating-chat-expanded"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-4 py-2 rounded-t-md flex items-center justify-between border-b-2 border-blue-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="text-white font-bold">Team Chat</h3>
        </div>
        <button
          onClick={toggleChat}
          className="text-white hover:text-red-300 transition-colors text-xl font-bold"
          title="Close Chat"
          data-testid="floating-chat-close"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 h-64 bg-parchment-100 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-umber-600 dark:text-gray-400 text-sm mt-8">
            No messages yet. Say hi to your team!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.playerId === currentPlayerId;
            const teamColor = msg.teamId === 1
              ? 'bg-orange-500/20 dark:bg-orange-600/20 border-orange-500 dark:border-orange-600'
              : 'bg-purple-500/20 dark:bg-purple-600/20 border-purple-500 dark:border-purple-600';

            return (
              <div
                key={index}
                className={`${teamColor} border-l-4 rounded px-3 py-2`}
                data-testid={`chat-message-${index}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-umber-900 dark:text-gray-100 text-sm">
                    {msg.playerName}
                    {isOwnMessage && <span className="text-blue-500 ml-1">(You)</span>}
                  </span>
                  <span className="text-umber-600 dark:text-gray-400 text-xs">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-umber-800 dark:text-gray-200 text-sm break-words">
                  {msg.message}
                </p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-amber-700 dark:border-gray-600">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-umber-700 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-umber-900 dark:text-gray-100 placeholder-umber-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            maxLength={200}
            data-testid="floating-chat-input"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded font-semibold transition-all disabled:cursor-not-allowed text-sm"
            data-testid="floating-chat-send"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

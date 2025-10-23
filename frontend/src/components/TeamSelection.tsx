import { Player, ChatMessage } from '../types/game';
import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useSettings } from '../contexts/SettingsContext';
import { HowToPlay } from './HowToPlay';
import { BotDifficulty } from '../utils/botPlayer';

interface TeamSelectionProps {
  players: Player[];
  gameId: string;
  currentPlayerId: string;
  creatorId: string;
  onSelectTeam: (teamId: 1 | 2) => void;
  onSwapPosition: (targetPlayerId: string) => void;
  onStartGame: () => void;
  onLeaveGame?: () => void;
  onAddBot?: () => void;
  onKickPlayer?: (playerId: string) => void;
  socket?: Socket | null;
  botDifficulty?: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
}

export function TeamSelection({
  players,
  gameId,
  currentPlayerId,
  creatorId,
  onSelectTeam,
  onSwapPosition,
  onStartGame,
  onLeaveGame,
  onAddBot,
  onKickPlayer,
  socket,
  botDifficulty = 'medium',
  onBotDifficultyChange,
}: TeamSelectionProps) {
  const { darkMode, setDarkMode } = useSettings();
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const team1Players = players.filter(p => p.teamId === 1);
  const team2Players = players.filter(p => p.teamId === 2);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showRules, setShowRules] = useState(false);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('team_selection_chat_message', handleChatMessage);

    return () => {
      socket.off('team_selection_chat_message', handleChatMessage);
    };
  }, [socket]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopyGameLink = async () => {
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
      logger.error('Failed to copy link:', err);
    }
  };

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

  // Validation for starting game
  const canStartGame = (): boolean => {
    if (players.length !== 4) return false;
    if (team1Players.length !== 2) return false;
    if (team2Players.length !== 2) return false;
    return true;
  };

  const getStartGameMessage = (): string => {
    if (players.length !== 4) {
      return `Waiting for ${4 - players.length} more player(s) to join`;
    }
    if (team1Players.length !== 2 || team2Players.length !== 2) {
      return 'Teams must have 2 players each';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
        <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
      </div>

      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-4xl w-full relative border-4 border-amber-700 dark:border-gray-600">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-br-xl"></div>

        {/* Top-left buttons */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {onLeaveGame && (
            <button
              onClick={onLeaveGame}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 border-2 border-red-800 shadow-lg transform hover:scale-105"
              title="Leave Game"
            >
              🚪 Leave
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 border-2 border-gray-900 shadow-lg transform hover:scale-105"
            title={darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <h2 className="text-3xl font-bold mb-6 text-umber-900 dark:text-gray-100 text-center font-serif mt-12">Team Selection</h2>

        <div className="mb-6">
          <p className="text-sm text-umber-700 dark:text-gray-300 mb-2">Game ID:</p>
          <div data-testid="game-id" className="bg-parchment-100 dark:bg-gray-700 p-3 rounded-lg font-mono text-lg text-center border-2 border-parchment-400 dark:border-gray-600 text-umber-900 dark:text-gray-100">{gameId}</div>

          {/* Copy Game Link Button */}
          <button
            onClick={handleCopyGameLink}
            className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg font-bold transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
            title="Copy shareable game link"
          >
            <span>🔗</span>
            <span>Copy Game Link</span>
          </button>
        </div>

        {/* Toast Notification */}
        {showCopyToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-green-700 animate-bounce z-50 flex items-center gap-2">
            <span>✅</span>
            <span className="font-bold">Game link copied! Share with friends.</span>
          </div>
        )}

        <div className="mb-8">
          <p className="text-center text-umber-700 dark:text-gray-300 mb-4">
            Players (<span data-testid="player-count">{players.length}</span>/4) - Choose your team and position
          </p>
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Team 1 */}
          <div data-testid="team-1-container" className="border-2 border-orange-300 dark:border-orange-600 rounded-lg p-6 bg-orange-50 dark:bg-orange-900/40">
            <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team1Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;

                return (
                  <div
                    key={`team1-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-orange-200 dark:bg-orange-700/60 border-orange-500 dark:border-orange-500'
                        : playerAtPosition
                        ? 'bg-parchment-50 dark:bg-gray-700 border-orange-200 dark:border-orange-700'
                        : 'bg-parchment-100 dark:bg-gray-700 border-dashed border-parchment-300 dark:border-gray-600'
                    }`}
                  >
                    {playerAtPosition ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="font-medium text-umber-900 dark:text-gray-100 text-center sm:text-left">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        <div className="flex gap-2">
                          {!isCurrentPlayer && currentPlayer && (
                            <button
                              onClick={() => onSwapPosition(playerAtPosition.id)}
                              className="text-xs bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-orange-800 shadow-sm flex-shrink-0"
                            >
                              Swap
                            </button>
                          )}
                          {!isCurrentPlayer && currentPlayerId === creatorId && onKickPlayer && (
                            <button
                              onClick={() => onKickPlayer(playerAtPosition.id)}
                              className="text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-red-800 shadow-sm flex-shrink-0"
                              title="Remove player from game"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        {currentPlayer?.teamId !== 1 ? (
                          <button
                            onClick={() => onSelectTeam(1)}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium"
                          >
                            Join Team 1
                          </button>
                        ) : (
                          <span className="text-umber-400 dark:text-gray-500">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team 2 */}
          <div data-testid="team-2-container" className="border-2 border-purple-300 dark:border-purple-600 rounded-lg p-6 bg-purple-50 dark:bg-purple-900/40">
            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team2Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;

                return (
                  <div
                    key={`team2-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-purple-200 dark:bg-purple-700/60 border-purple-500 dark:border-purple-500'
                        : playerAtPosition
                        ? 'bg-parchment-50 dark:bg-gray-700 border-purple-200 dark:border-purple-700'
                        : 'bg-parchment-100 dark:bg-gray-700 border-dashed border-parchment-300 dark:border-gray-600'
                    }`}
                  >
                    {playerAtPosition ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="font-medium text-umber-900 dark:text-gray-100 text-center sm:text-left">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        <div className="flex gap-2">
                          {!isCurrentPlayer && currentPlayer && (
                            <button
                              onClick={() => onSwapPosition(playerAtPosition.id)}
                              className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-purple-800 shadow-sm flex-shrink-0"
                            >
                              Swap
                            </button>
                          )}
                          {!isCurrentPlayer && currentPlayerId === creatorId && onKickPlayer && (
                            <button
                              onClick={() => onKickPlayer(playerAtPosition.id)}
                              className="text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-red-800 shadow-sm flex-shrink-0"
                              title="Remove player from game"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        {currentPlayer?.teamId !== 2 ? (
                          <button
                            onClick={() => onSelectTeam(2)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                          >
                            Join Team 2
                          </button>
                        ) : (
                          <span className="text-umber-400 dark:text-gray-500">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Box */}
        {socket && (
          <div className="mb-6 border-2 border-parchment-400 dark:border-gray-600 rounded-lg p-4 bg-parchment-100 dark:bg-gray-700">
            <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              💬 Team Chat
            </h3>

            {/* Messages */}
            <div className="bg-parchment-50 dark:bg-gray-800 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto border border-parchment-300 dark:border-gray-600">
              {messages.length === 0 ? (
                <p className="text-sm text-umber-500 text-center py-4">No messages yet. Say hi!</p>
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
                      <div className="font-bold text-umber-900 dark:text-gray-100">
                        {msg.playerName}
                        {msg.playerId === currentPlayerId && ' (You)'}:
                      </div>
                      <div className="text-umber-800 dark:text-gray-200 mt-1">{msg.message}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message... (max 200 chars)"
                maxLength={200}
                className="flex-1 px-3 py-2 border-2 border-parchment-400 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-50 dark:bg-gray-800 text-umber-900 dark:text-gray-100 text-sm"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 border-2 border-blue-800 disabled:border-gray-600 shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Bot Difficulty & Start Game Section */}
        <div className="text-center space-y-3">
          {/* Bot Difficulty Selector */}
          {players.length < 4 && onAddBot && onBotDifficultyChange && (
            <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-600 max-w-md mx-auto">
              <label className="block text-xs font-semibold text-umber-700 dark:text-gray-300 mb-2">
                Bot Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onBotDifficultyChange('easy')}
                  className={`py-2 px-2 rounded font-bold transition-all duration-200 text-xs ${
                    botDifficulty === 'easy'
                      ? 'bg-umber-600 dark:bg-gray-600 text-white shadow-md scale-105 border border-umber-800 dark:border-gray-500'
                      : 'bg-parchment-100 dark:bg-gray-600 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-500'
                  }`}
                >
                  Easy
                </button>
                <button
                  onClick={() => onBotDifficultyChange('medium')}
                  className={`py-2 px-2 rounded font-bold transition-all duration-200 text-xs ${
                    botDifficulty === 'medium'
                      ? 'bg-umber-600 dark:bg-gray-600 text-white shadow-md scale-105 border border-umber-800 dark:border-gray-500'
                      : 'bg-parchment-100 dark:bg-gray-600 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-500'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => onBotDifficultyChange('hard')}
                  className={`py-2 px-2 rounded font-bold transition-all duration-200 text-xs ${
                    botDifficulty === 'hard'
                      ? 'bg-umber-600 dark:bg-gray-600 text-white shadow-md scale-105 border border-umber-800 dark:border-gray-500'
                      : 'bg-parchment-100 dark:bg-gray-600 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-500'
                  }`}
                >
                  Hard
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center items-center">
            {/* Add Bot Button - only show if less than 4 players and onAddBot is provided */}
            {players.length < 4 && onAddBot && (
              <button
                onClick={onAddBot}
                className="bg-gradient-to-r from-umber-600 to-amber-700 dark:from-gray-600 dark:to-gray-700 hover:from-umber-700 hover:to-amber-800 dark:hover:from-gray-700 dark:hover:to-gray-800 text-white px-6 py-3 rounded-lg text-base font-bold transition-all duration-200 border border-umber-800 dark:border-gray-600 shadow flex items-center gap-2"
                title="Add a bot player"
              >
                🤖 Add Bot
              </button>
            )}

            {canStartGame() ? (
              <button
                data-testid="start-game-button"
                onClick={onStartGame}
                className="bg-forest-600 text-parchment-50 px-8 py-3 rounded-lg text-lg font-bold hover:bg-forest-700 shadow-lg transition-colors border-2 border-forest-700"
              >
                Start Game
              </button>
            ) : (
              <button
                data-testid="start-game-button-disabled"
                disabled
                className="bg-parchment-300 text-umber-500 px-8 py-3 rounded-lg text-lg font-bold cursor-not-allowed border-2 border-parchment-400 dark:border-gray-600"
              >
                Start Game
              </button>
            )}
          </div>

          {!canStartGame() && (
            <p data-testid="start-game-message" className="text-umber-800 dark:text-gray-200 bg-parchment-200 dark:bg-gray-600 border-2 border-umber-400 px-4 py-2 rounded-lg">
              {getStartGameMessage()}
            </p>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowRules(true)}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 text-white py-3 rounded-xl font-bold hover:from-amber-700 hover:to-amber-800 dark:hover:from-amber-800 dark:hover:to-amber-900 transition-all duration-300 border-2 border-amber-800 dark:border-amber-900 shadow-lg transform hover:scale-105"
          >
            📖 Game Rules
          </button>
        </div>
      </div>

      {/* Game Rules Modal */}
      <HowToPlay isModal={true} isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

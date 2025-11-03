import { Player, ChatMessage } from '../types/game';
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useSettings } from '../contexts/SettingsContext';
import { HowToPlay } from './HowToPlay';
import { BotDifficulty } from '../utils/botPlayer';
import { PlayerConnectionIndicator } from './PlayerConnectionIndicator';
import { FloatingTeamChat } from './FloatingTeamChat';

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
  const [showRules, setShowRules] = useState(false);

  // Listen for chat messages (for FloatingTeamChat)
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

  const handleCopyGameLink = async () => {
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
    }
  };

  // Validation for starting game
  const canStartGame = (): boolean => {
    // Must have 4 players (including real players, bots, but NOT empty seats)
    const realPlayers = players.filter(p => !p.isEmpty);
    if (realPlayers.length !== 4) return false;

    // Must have 2 real players per team (no empty seats)
    const team1RealPlayers = team1Players.filter(p => !p.isEmpty);
    const team2RealPlayers = team2Players.filter(p => !p.isEmpty);
    if (team1RealPlayers.length !== 2) return false;
    if (team2RealPlayers.length !== 2) return false;
    return true;
  };

  const getStartGameMessage = (): string => {
    const realPlayers = players.filter(p => !p.isEmpty);
    const emptySeats = players.filter(p => p.isEmpty).length;

    if (emptySeats > 0) {
      return `${emptySeats} empty seat(s) - fill them to start`;
    }
    if (realPlayers.length !== 4) {
      return `Waiting for ${4 - realPlayers.length} more player(s) to join`;
    }

    const team1RealPlayers = team1Players.filter(p => !p.isEmpty);
    const team2RealPlayers = team2Players.filter(p => !p.isEmpty);
    if (team1RealPlayers.length !== 2 || team2RealPlayers.length !== 2) {
      return 'Teams must have 2 players each (no empty seats)';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-parchment-50 dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-4xl w-full relative border-2 border-amber-700 dark:border-gray-600 backdrop-blur-sm">

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
                const isEmptySeat = playerAtPosition?.isEmpty;

                return (
                  <div
                    key={`team1-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-orange-200 dark:bg-orange-700/60 border-orange-500 dark:border-orange-500'
                        : playerAtPosition && !isEmptySeat
                        ? 'bg-parchment-50 dark:bg-gray-700 border-orange-200 dark:border-orange-700'
                        : 'bg-parchment-100 dark:bg-gray-700 border-dashed border-parchment-300 dark:border-gray-600'
                    }`}
                  >
                    {playerAtPosition && !isEmptySeat ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-umber-900 dark:text-gray-100 text-center sm:text-left">
                            {playerAtPosition.name}
                            {isCurrentPlayer && ' (You)'}
                          </span>
                          {!playerAtPosition.isBot && (
                            <PlayerConnectionIndicator
                              status={playerAtPosition.connectionStatus}
                              reconnectTimeLeft={playerAtPosition.reconnectTimeLeft}
                              small
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isCurrentPlayer && currentPlayer && currentPlayer.teamId === 1 && (
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
                        {isEmptySeat ? (
                          <div className="space-y-2">
                            <div className="text-umber-400 dark:text-gray-500 text-sm italic">
                              💺 {playerAtPosition.emptySlotName || 'Empty Seat'}
                            </div>
                            {!currentPlayer && socket && (
                              <button
                                onClick={() => {
                                  // Get player index to fill the seat
                                  const allPlayers = players;
                                  const seatIndex = allPlayers.findIndex(p => p.id === playerAtPosition.id);
                                  if (seatIndex !== -1) {
                                    const playerName = prompt('Enter your name to fill this seat:');
                                    if (playerName && playerName.trim()) {
                                      socket.emit('fill_empty_seat', {
                                        gameId,
                                        playerName: playerName.trim(),
                                        emptySlotIndex: seatIndex,
                                      });
                                    }
                                  }
                                }}
                                className="text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-green-800 shadow-sm"
                              >
                                Fill Seat
                              </button>
                            )}
                          </div>
                        ) : currentPlayer?.teamId !== 1 ? (
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
                const isEmptySeat = playerAtPosition?.isEmpty;

                return (
                  <div
                    key={`team2-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-purple-200 dark:bg-purple-700/60 border-purple-500 dark:border-purple-500'
                        : playerAtPosition && !isEmptySeat
                        ? 'bg-parchment-50 dark:bg-gray-700 border-purple-200 dark:border-purple-700'
                        : 'bg-parchment-100 dark:bg-gray-700 border-dashed border-parchment-300 dark:border-gray-600'
                    }`}
                  >
                    {playerAtPosition && !isEmptySeat ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-umber-900 dark:text-gray-100 text-center sm:text-left">
                            {playerAtPosition.name}
                            {isCurrentPlayer && ' (You)'}
                          </span>
                          {!playerAtPosition.isBot && (
                            <PlayerConnectionIndicator
                              status={playerAtPosition.connectionStatus}
                              reconnectTimeLeft={playerAtPosition.reconnectTimeLeft}
                              small
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isCurrentPlayer && currentPlayer && currentPlayer.teamId === 2 && (
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
                        {isEmptySeat ? (
                          <div className="space-y-2">
                            <div className="text-umber-400 dark:text-gray-500 text-sm italic">
                              💺 {playerAtPosition.emptySlotName || 'Empty Seat'}
                            </div>
                            {!currentPlayer && socket && (
                              <button
                                onClick={() => {
                                  // Get player index to fill the seat
                                  const allPlayers = players;
                                  const seatIndex = allPlayers.findIndex(p => p.id === playerAtPosition.id);
                                  if (seatIndex !== -1) {
                                    const playerName = prompt('Enter your name to fill this seat:');
                                    if (playerName && playerName.trim()) {
                                      socket.emit('fill_empty_seat', {
                                        gameId,
                                        playerName: playerName.trim(),
                                        emptySlotIndex: seatIndex,
                                      });
                                    }
                                  }
                                }}
                                className="text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-green-800 shadow-sm"
                              >
                                Fill Seat
                              </button>
                            )}
                          </div>
                        ) : currentPlayer?.teamId !== 2 ? (
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

      {/* Floating Team Chat */}
      {socket && (
        <FloatingTeamChat
          gameId={gameId}
          socket={socket}
          messages={messages}
          currentPlayerId={currentPlayerId}
          currentPlayerTeamId={currentPlayer?.teamId}
        />
      )}
    </div>
  );
}

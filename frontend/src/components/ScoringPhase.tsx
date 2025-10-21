import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, RoundStatistics } from '../types/game';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { sounds } from '../utils/sounds';

interface ScoringPhaseProps {
  gameState: GameState;
  socket: Socket | null;
  gameId: string;
  currentPlayerId: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
}

export function ScoringPhase({
  gameState,
  socket,
  gameId,
  currentPlayerId,
  chatMessages = [],
  onNewChatMessage
}: ScoringPhaseProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);

  const isReady = gameState.playersReady?.includes(currentPlayerId) || false;
  const readyCount = gameState.playersReady?.length || 0;

  // Calculate time remaining
  useEffect(() => {
    if (!gameState.roundEndTimestamp) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - (gameState.roundEndTimestamp || 0);
      const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.roundEndTimestamp]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      if (!chatOpen) {
        setUnreadCount(prev => prev + 1);
        // Play notification sound if message is from another player
        if (msg.playerId !== currentPlayerId) {
          sounds.chatNotification();
        }
      }
    };

    socket.on('game_chat_message', handleChatMessage);

    return () => {
      socket.off('game_chat_message', handleChatMessage);
    };
  }, [socket, chatOpen]);

  // Reset unread count when chat opens
  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  const handleReady = () => {
    if (!socket || isReady) return;
    socket.emit('player_ready', { gameId });
  };

  // Get latest round statistics
  const latestRound = gameState.roundHistory[gameState.roundHistory.length - 1];
  const statistics: RoundStatistics | undefined = latestRound?.statistics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center p-6">
      {/* Chat Panel */}
      {socket && onNewChatMessage && (
        <ChatPanel
          socket={socket}
          gameId={gameId}
          currentPlayerId={currentPlayerId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onNewMessage={onNewChatMessage}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-4xl w-full relative">
        {/* Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-all relative"
        >
          💬 Chat
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200 text-center">
          Round {gameState.roundNumber} Complete!
        </h2>

        {/* Timer and Ready Status */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-blue-600">
                {timeRemaining}s
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {readyCount}/4 players ready
              </span>
              <button
                onClick={handleReady}
                disabled={isReady}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  isReady
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isReady ? '✓ Ready' : 'Ready Up'}
              </button>
            </div>
          </div>
          {/* Ready indicator dots */}
          <div className="flex gap-2 mt-3 justify-center">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < readyCount ? 'bg-green-500 scale-110' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Team Scores - Large and Clear */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Team 1</h3>
            <p className="text-5xl font-bold text-orange-600">{gameState.teamScores.team1}</p>
            <p className="text-xs text-orange-700 mt-2">Total Score</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Team 2</h3>
            <p className="text-5xl font-bold text-purple-600">{gameState.teamScores.team2}</p>
            <p className="text-xs text-purple-700 mt-2">Total Score</p>
          </div>
        </div>

        {/* Round Summary - Team-based */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6 border border-gray-200">
          <h3 className="text-center font-bold text-gray-700 mb-3">Round Summary</h3>
          <div className="space-y-4">
            {/* Team 1 */}
            {(() => {
              const team1Players = gameState.players.filter(p => p.teamId === 1);
              const team1Points = team1Players.reduce((sum, p) => sum + p.pointsWon, 0);
              const team1Tricks = team1Players.reduce((sum, p) => sum + p.tricksWon, 0);

              return (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-orange-800 flex items-center gap-2">
                      Team 1
                      {team1Points > 0 && (
                        <span className="px-2 py-0.5 rounded-full font-black text-white shadow-lg border-2 text-xs bg-green-500 border-green-300">
                          +{team1Points}
                        </span>
                      )}
                    </h4>
                    <span className="text-sm font-semibold text-orange-700">
                      {team1Tricks} tricks ({team1Points} pts)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {team1Players.map((player) => {
                      const isHighestBidder = gameState.highestBet && gameState.highestBet.playerId === player.id;
                      return (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            {player.name}
                            {isHighestBidder && <span className="text-xs text-yellow-600">⭐</span>}
                          </span>
                          <span className="text-gray-600">
                            {player.tricksWon} tricks ({player.pointsWon} pts)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Team 2 */}
            {(() => {
              const team2Players = gameState.players.filter(p => p.teamId === 2);
              const team2Points = team2Players.reduce((sum, p) => sum + p.pointsWon, 0);
              const team2Tricks = team2Players.reduce((sum, p) => sum + p.tricksWon, 0);

              return (
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-purple-800 flex items-center gap-2">
                      Team 2
                      {team2Points > 0 && (
                        <span className="px-2 py-0.5 rounded-full font-black text-white shadow-lg border-2 text-xs bg-green-500 border-green-300">
                          +{team2Points}
                        </span>
                      )}
                    </h4>
                    <span className="text-sm font-semibold text-purple-700">
                      {team2Tricks} tricks ({team2Points} pts)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {team2Players.map((player) => {
                      const isHighestBidder = gameState.highestBet && gameState.highestBet.playerId === player.id;
                      return (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            {player.name}
                            {isHighestBidder && <span className="text-xs text-yellow-600">⭐</span>}
                          </span>
                          <span className="text-gray-600">
                            {player.tricksWon} tricks ({player.pointsWon} pts)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Round Statistics */}
        {statistics && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border-2 border-amber-200 mb-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 text-center">🏅 Round Highlights</h3>
            <div className="grid grid-cols-2 gap-4">
              {statistics.fastestPlay && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">⚡</div>
                  <p className="text-sm text-gray-600 text-center">Fastest Play</p>
                  <p className="font-bold text-lg text-center text-gray-800">
                    {statistics.fastestPlay.playerName}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    {(statistics.fastestPlay.timeMs / 1000).toFixed(1)}s avg
                  </p>
                </div>
              )}

              {statistics.mostAggressiveBidder && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">🎲</div>
                  <p className="text-sm text-gray-600 text-center">Most Aggressive</p>
                  <p className="font-bold text-lg text-center text-gray-800">
                    {statistics.mostAggressiveBidder.playerName}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    {statistics.mostAggressiveBidder.bidAmount} pts
                  </p>
                </div>
              )}

              {statistics.trumpMaster && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">👑</div>
                  <p className="text-sm text-gray-600 text-center">Trump Master</p>
                  <p className="font-bold text-lg text-center text-gray-800">
                    {statistics.trumpMaster.playerName}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    {statistics.trumpMaster.trumpsPlayed} trumps played
                  </p>
                </div>
              )}

              {statistics.luckyPlayer && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">🍀</div>
                  <p className="text-sm text-gray-600 text-center">Lucky Player</p>
                  <p className="font-bold text-lg text-center text-gray-800">
                    {statistics.luckyPlayer.playerName}
                  </p>
                  <p className="text-xs text-gray-500 text-center">
                    {statistics.luckyPlayer.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, RoundStatistics } from '../types/game';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { sounds } from '../utils/sounds';
import { useSettings } from '../contexts/SettingsContext';
import { GameHeader } from './GameHeader';

interface ScoringPhaseProps {
  gameState: GameState;
  socket: Socket | null;
  gameId: string;
  currentPlayerId: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  onLeaveGame?: () => void;
  isSpectator?: boolean;
}

export function ScoringPhase({
  gameState,
  socket,
  gameId,
  currentPlayerId,
  chatMessages = [],
  onNewChatMessage,
  onLeaveGame,
  isSpectator = false
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex flex-col">
      {/* Game Header */}
      <GameHeader
        gameId={gameId}
        roundNumber={gameState.roundNumber}
        team1Score={gameState.teamScores.team1}
        team2Score={gameState.teamScores.team2}
        onLeaveGame={onLeaveGame}
        onOpenChat={() => setChatOpen(true)}
        isSpectator={isSpectator}
        unreadChatCount={unreadCount}
      />

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

      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-8 shadow-2xl max-w-4xl w-full">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-200 text-center">
            Round {gameState.roundNumber} Complete!
          </h2>

        {/* Timer and Ready Status */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/40 dark:to-purple-900/40 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-600">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            {/* Timer - Centered on mobile, left on desktop */}
            <div className="flex items-center gap-3">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-300">
                {timeRemaining}s
              </div>
            </div>
            {/* Ready Status and Button - Stacked on mobile, horizontal on desktop */}
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
              <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {readyCount}/4 players ready
              </span>
              <button
                onClick={handleReady}
                disabled={isReady}
                className={`px-4 md:px-6 py-2 rounded-lg font-bold transition-all text-sm md:text-base w-full md:w-auto ${
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
          <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/40 rounded-lg border-2 border-orange-200 dark:border-orange-600">
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">Team 1</h3>
            <p className="text-5xl font-bold text-orange-600 dark:text-orange-300">{gameState.teamScores.team1}</p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">Total Score</p>
          </div>
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/40 rounded-lg border-2 border-purple-200 dark:border-purple-600">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">Team 2</h3>
            <p className="text-5xl font-bold text-purple-600 dark:text-purple-300">{gameState.teamScores.team2}</p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">Total Score</p>
          </div>
        </div>

        {/* Round Summary - Team-based */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-center font-bold text-gray-700 dark:text-gray-200 mb-3">Round Summary</h3>
          <div className="space-y-4">
            {/* Team 1 */}
            {(() => {
              const team1Players = gameState.players.filter(p => p.teamId === 1);
              const team1Points = team1Players.reduce((sum, p) => sum + p.pointsWon, 0);
              const team1Tricks = team1Players.reduce((sum, p) => sum + p.tricksWon, 0);

              return (
                <div className="bg-orange-50 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-600 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      Team 1
                      {team1Points > 0 && (
                        <span className="px-2 py-0.5 rounded-full font-black text-white shadow-lg border-2 text-xs bg-green-500 border-green-300">
                          +{team1Points}
                        </span>
                      )}
                    </h4>
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      {team1Tricks} tricks ({team1Points} pts)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {team1Players.map((player) => {
                      const isHighestBidder = gameState.highestBet && gameState.highestBet.playerId === player.id;
                      return (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                            {player.name}
                            {isHighestBidder && <span className="text-xs text-yellow-600">⭐</span>}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
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
                <div className="bg-purple-50 dark:bg-purple-900/40 border border-purple-300 dark:border-purple-600 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                      Team 2
                      {team2Points > 0 && (
                        <span className="px-2 py-0.5 rounded-full font-black text-white shadow-lg border-2 text-xs bg-green-500 border-green-300">
                          +{team2Points}
                        </span>
                      )}
                    </h4>
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      {team2Tricks} tricks ({team2Points} pts)
                    </span>
                  </div>
                  <div className="space-y-1">
                    {team2Players.map((player) => {
                      const isHighestBidder = gameState.highestBet && gameState.highestBet.playerId === player.id;
                      return (
                        <div key={player.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                            {player.name}
                            {isHighestBidder && <span className="text-xs text-yellow-600">⭐</span>}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
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

        {/* Trick History */}
        {latestRound?.tricks && latestRound.tricks.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-lg p-4 mb-6 border-2 border-indigo-200 dark:border-indigo-600">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 text-center">🃏 Trick History</h3>
            <div className="space-y-3">
              {latestRound.tricks.map((trickResult, index) => {
                const winner = gameState.players.find(p => p.id === trickResult.winnerId);
                const winnerTeam = winner?.teamId;
                return (
                  <div
                    key={index}
                    className={`rounded-lg p-3 border-2 ${
                      winnerTeam === 1
                        ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600'
                        : 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-700 dark:text-gray-200">
                        Trick {index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        winnerTeam === 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {winner?.name} won {trickResult.points > 0 ? `+${trickResult.points}` : trickResult.points} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {trickResult.trick.map((trickCard, cardIndex) => {
                        const player = gameState.players.find(p => p.id === trickCard.playerId);
                        const isWinner = trickCard.playerId === trickResult.winnerId;
                        return (
                          <div
                            key={cardIndex}
                            className={`text-center p-2 rounded ${
                              isWinner
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 border-2 border-yellow-400'
                                : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                              {player?.name}
                            </div>
                            <div className={`text-2xl font-bold ${
                              trickCard.card.color === 'red' ? 'text-red-600' :
                              trickCard.card.color === 'blue' ? 'text-blue-600' :
                              trickCard.card.color === 'green' ? 'text-green-600' :
                              trickCard.card.color === 'brown' ? 'text-amber-800' :
                              'text-gray-600'
                            }`}>
                              {trickCard.card.value}
                            </div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 capitalize">
                              {trickCard.card.color}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Round Statistics */}
        {statistics && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-600 mb-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 text-center">🏅 Round Highlights</h3>
            <div className="grid grid-cols-2 gap-4">
              {statistics.fastestPlay && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">⚡</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Fastest Play</p>
                  <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                    {statistics.fastestPlay.playerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {(statistics.fastestPlay.timeMs / 1000).toFixed(1)}s avg
                  </p>
                </div>
              )}

              {statistics.mostAggressiveBidder && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">🎲</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Most Aggressive</p>
                  <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                    {statistics.mostAggressiveBidder.playerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {statistics.mostAggressiveBidder.bidAmount} pts
                  </p>
                </div>
              )}

              {statistics.trumpMaster && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">👑</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Trump Master</p>
                  <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                    {statistics.trumpMaster.playerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {statistics.trumpMaster.trumpsPlayed} trumps played
                  </p>
                </div>
              )}

              {statistics.luckyPlayer && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">🍀</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Lucky Player</p>
                  <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                    {statistics.luckyPlayer.playerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {statistics.luckyPlayer.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

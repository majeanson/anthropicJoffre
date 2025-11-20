import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, RoundStatistics } from '../types/game';
import { UnifiedChat } from './UnifiedChat';
import { ChatMessage } from '../types/game';
import { sounds } from '../utils/sounds';
import { GameHeader } from './GameHeader';
import { TrickHistory } from './TrickHistory';
import { useChatNotifications } from '../hooks/useChatNotifications';

interface ScoringPhaseProps {
  gameState: GameState;
  socket: Socket | null;
  gameId: string;
  currentPlayerId: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  onLeaveGame?: () => void;
  onOpenBotManagement?: () => void;
  onOpenAchievements?: () => void; // Sprint 2 Phase 1
  onOpenFriends?: () => void; // Sprint 2 Phase 2
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
  onOpenBotManagement,
  onOpenAchievements,
  onOpenFriends,
  isSpectator = false
}: ScoringPhaseProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [dataReady, setDataReady] = useState(false);

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage
  });

  // Find current player to get their name (playersReady now stores names, not IDs)
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const currentPlayerName = currentPlayer?.name || '';
  const isReady = gameState.playersReady?.includes(currentPlayerName) || false;
  const readyCount = gameState.playersReady?.length || 0;

  // Check if round data is ready (prevents showing stale data during transition)
  useEffect(() => {
    const latestRound = gameState.roundHistory[gameState.roundHistory.length - 1];
    const expectedRoundNumber = gameState.roundNumber;

    // Wait for the latest round to match the expected round number
    // This ensures we don't show stale data from the previous round
    if (latestRound && latestRound.roundNumber === expectedRoundNumber) {
      // Add a small delay to ensure all data is fully computed
      const timer = setTimeout(() => {
        setDataReady(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDataReady(false);
    }
  }, [gameState.roundHistory, gameState.roundNumber]);

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
        onOpenBotManagement={onOpenBotManagement}
        onOpenAchievements={onOpenAchievements}
        onOpenFriends={onOpenFriends}
        botCount={gameState.players.filter(p => p.isBot).length}
        isSpectator={isSpectator}
        unreadChatCount={unreadChatCount}
      />

      {/* Chat Panel */}
      {socket && onNewChatMessage && (
        <UnifiedChat
          mode="panel"
          context="game"
          socket={socket}
          gameId={gameId}
          currentPlayerId={currentPlayerId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onSendMessage={(message) => {
            socket.emit('send_game_chat', {
              gameId,
              message: message.trim()
            });
            // Trigger new message callback for sound effects
            onNewChatMessage({
              playerId: currentPlayerId,
              playerName: gameState.players.find(p => p.id === currentPlayerId)?.name || 'Unknown',
              message: message.trim(),
              timestamp: Date.now(),
              teamId: gameState.players.find(p => p.id === currentPlayerId)?.teamId || null
            });
          }}
          title="💬 Game Chat"
        />
      )}

      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-8 shadow-2xl max-w-4xl w-full">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-200 text-center" data-testid="scoring-phase-heading">
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
                data-testid="ready-button"
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

        {/* Loading Animation OR Data Display */}
        {!dataReady ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              {/* Spinning cards animation */}
              <div className="flex gap-2 mb-4">
                <div className="w-12 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-lg animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-12 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-12 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-12 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg animate-bounce" style={{animationDelay: '0.3s'}}></div>
              </div>
              <p className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
                Calculating round results...
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Team Scores - Large and Clear */}
            <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/40 rounded-lg border-2 border-orange-200 dark:border-orange-600" data-testid="team-1-score-card">
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">Team 1</h3>
            <p className="text-5xl font-bold text-orange-600 dark:text-orange-300" data-testid="team-1-score">{gameState.teamScores.team1}</p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">Total Score</p>
          </div>
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/40 rounded-lg border-2 border-purple-200 dark:border-purple-600" data-testid="team-2-score-card">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">Team 2</h3>
            <p className="text-5xl font-bold text-purple-600 dark:text-purple-300" data-testid="team-2-score">{gameState.teamScores.team2}</p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">Total Score</p>
          </div>
        </div>

        {/* Current Bet Information */}
        {latestRound && (
          <section className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
              🎲 Round Bet
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-600">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-1">Highest Bidder</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {gameState.players.find(p => p.id === latestRound.highestBet.playerId)?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Team {latestRound.offensiveTeam}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-1">Bet Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {latestRound.betAmount} points
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-1">Type</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {latestRound.withoutTrump ? (
                      <span className="text-red-600 dark:text-red-400">Without Trump (2x)</span>
                    ) : (
                      'With Trump'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Round Results */}
        {latestRound && (
          <section className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
              📊 Round Results
            </h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">Offensive Team</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">Team {latestRound.offensiveTeam}</p>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">Points Earned</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {latestRound.offensivePoints} / {latestRound.betAmount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">Defensive Points</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {latestRound.defensivePoints}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">Result</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                    latestRound.betMade
                      ? 'bg-green-100 text-green-800 border-green-400 dark:bg-green-900/40 dark:text-green-200'
                      : 'bg-red-100 text-red-800 border-red-400 dark:bg-red-900/40 dark:text-red-200'
                  }`}>
                    {latestRound.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                  </span>
                </div>
              </div>
              <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">Round Score:</p>
                <p className="font-bold">
                  <span className="text-orange-600 dark:text-orange-400">
                    Team 1: {latestRound.roundScore.team1 >= 0 ? '+' : ''}{latestRound.roundScore.team1}
                  </span>
                  {' | '}
                  <span className="text-purple-600 dark:text-purple-400">
                    Team 2: {latestRound.roundScore.team2 >= 0 ? '+' : ''}{latestRound.roundScore.team2}
                  </span>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Detailed Trick History */}
        {latestRound?.tricks && latestRound.tricks.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
              🃏 Tricks Played
            </h3>
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/40 dark:to-blue-900/40 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-600">
              {latestRound.trump && (
                <div className="mb-4 flex items-center justify-center gap-2">
                  <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-3 py-1 rounded-full font-semibold border-2 border-blue-300 dark:border-blue-700">
                    Trump: <span className="capitalize">{latestRound.trump}</span>
                  </span>
                </div>
              )}
              <TrickHistory
                tricks={latestRound.tricks}
                players={gameState.players}
                trump={latestRound.trump}
                showWinner={true}
              />
            </div>
          </section>
        )}

        {/* Round Statistics */}
        {statistics && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/40 dark:to-yellow-900/40 rounded-lg p-4 border-2 border-amber-200 dark:border-amber-600 mb-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 text-center">🏅 Round Highlights</h3>
            <div className="grid grid-cols-2 gap-4">
              {statistics.trickMaster && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">🏆</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Trick Master</p>
                  <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                    {statistics.trickMaster.playerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {statistics.trickMaster.tricksWon} tricks
                  </p>
                </div>
              )}

              {statistics.pointLeader && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-300 shadow-sm">
                  <div className="text-3xl mb-2 text-center">💎</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Point Leader</p>
                  <p className="font-bold text-lg text-center text-gray-800 dark:text-gray-100">
                    {statistics.pointLeader.playerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {statistics.pointLeader.pointsEarned} pts
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
                    {statistics.luckyPlayer.redZeros} red 0{statistics.luckyPlayer.redZeros > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

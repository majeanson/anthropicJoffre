import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, RoundStatistics } from '../types/game';
import { UnifiedChat } from './UnifiedChat';
import { ChatMessage } from '../types/game';
import { GameHeader } from './GameHeader';
import { TrickHistory } from './TrickHistory';
import { useChatNotifications } from '../hooks/useChatNotifications';
import { UICard, Button } from './ui';

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
  isSpectator = false,
}: ScoringPhaseProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [dataReady, setDataReady] = useState(false);

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage,
  });

  // Find current player to get their name (playersReady now stores names, not IDs)
  const currentPlayer = gameState.players.find(
    (p) => p.name === currentPlayerId || p.id === currentPlayerId
  );
  const currentPlayerName = currentPlayer?.name || '';
  const isReady = gameState.playersReady?.includes(currentPlayerName) || false;
  const readyCount = gameState.playersReady?.length || 0;

  // Check if round data is ready (prevents showing stale data during transition)
  useEffect(() => {
    // Safety check: ensure roundHistory exists and has entries
    if (!gameState.roundHistory || gameState.roundHistory.length === 0) {
      setDataReady(false);
      return;
    }

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

  // Get latest round statistics (with safety check)
  const latestRound =
    gameState.roundHistory?.length > 0
      ? gameState.roundHistory[gameState.roundHistory.length - 1]
      : undefined;
  const statistics: RoundStatistics | undefined = latestRound?.statistics;

  return (
    <div className="min-h-screen flex flex-col bg-skin-primary">
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
        botCount={gameState.players.filter((p) => p.isBot).length}
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
              message: message.trim(),
            });
            // Trigger new message callback for sound effects
            onNewChatMessage({
              playerId: currentPlayerId,
              playerName:
                gameState.players.find((p) => p.id === currentPlayerId)?.name || 'Unknown',
              message: message.trim(),
              timestamp: Date.now(),
              teamId: gameState.players.find((p) => p.id === currentPlayerId)?.teamId || null,
            });
          }}
          title="💬 Game Chat"
        />
      )}

      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <UICard variant="elevated" size="lg" className="bg-parchment-100 max-w-4xl w-full">
          <h2
            className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-skin-primary text-center"
            data-testid="scoring-phase-heading"
          >
            Round {gameState.roundNumber} Complete!
          </h2>

          {/* Timer and Ready Status */}
          <UICard variant="gradient" gradient="info" className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              {/* Timer - Centered on mobile, left on desktop */}
              <div className="flex items-center gap-3">
                <div className="text-3xl md:text-4xl font-bold text-blue-700">
                  {timeRemaining}s
                </div>
              </div>
              {/* Ready Status and Button - Stacked on mobile, horizontal on desktop */}
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
                <span className="text-xs md:text-sm text-blue-800 whitespace-nowrap">
                  {readyCount}/4 players ready
                </span>
                <Button
                  onClick={handleReady}
                  disabled={isReady}
                  data-testid="ready-button"
                  variant={isReady ? 'success' : 'primary'}
                  size="md"
                  className="w-full md:w-auto"
                >
                  {isReady ? <span aria-hidden="true">✓</span> : ''}
                  {isReady ? ' Ready' : 'Ready Up'}
                </Button>
              </div>
            </div>
            {/* Ready indicator dots */}
            <div className="flex gap-2 mt-3 justify-center">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < readyCount ? 'bg-green-600 scale-110' : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </UICard>

          {/* Loading Animation OR Data Display */}
          {!dataReady ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                {/* Spinning cards animation */}
                <div className="flex gap-2 mb-4">
                  <div
                    className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-r from-red-600 to-rose-600"
                    style={{ animationDelay: '0s' }}
                  ></div>
                  <div
                    className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-r from-blue-600 to-cyan-600"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-r from-green-600 to-emerald-600"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-12 h-16 rounded-lg animate-bounce bg-gradient-to-r from-yellow-600 to-orange-600"
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                </div>
                <p className="text-center text-lg font-semibold text-skin-secondary animate-pulse">
                  Calculating round results...
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Team Scores - Large and Clear */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <UICard
                  variant="gradient"
                  gradient="team1"
                  className="text-center"
                  data-testid="team-1-score-card"
                >
                  <h3 className="text-lg font-semibold text-team1 mb-2">Team 1</h3>
                  <p
                    className="text-5xl font-bold text-team1"
                    data-testid="team-1-score"
                  >
                    {gameState.teamScores.team1}
                  </p>
                  <p className="text-xs text-team1 opacity-80 mt-2">Total Score</p>
                </UICard>
                <UICard
                  variant="gradient"
                  gradient="team2"
                  className="text-center"
                  data-testid="team-2-score-card"
                >
                  <h3 className="text-lg font-semibold text-team2 mb-2">Team 2</h3>
                  <p
                    className="text-5xl font-bold text-team2"
                    data-testid="team-2-score"
                  >
                    {gameState.teamScores.team2}
                  </p>
                  <p className="text-xs text-team2 opacity-80 mt-2">Total Score</p>
                </UICard>
              </div>

              {/* Current Bet Information */}
              {latestRound && latestRound.highestBet && (
                <section className="mb-6">
                  <h3 className="text-xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2">
                    <span aria-hidden="true">🎲</span> Round Bet
                  </h3>
                  <UICard variant="gradient" gradient="info">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-blue-700 font-semibold mb-1">Highest Bidder</p>
                        <p className="text-lg font-bold text-skin-primary">
                          {gameState.players.find((p) => p.id === latestRound.highestBet?.playerId)
                            ?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-blue-600">Team {latestRound.offensiveTeam}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 font-semibold mb-1">Bet Amount</p>
                        <p className="text-lg font-bold text-skin-primary">
                          {latestRound.betAmount} points
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 font-semibold mb-1">Type</p>
                        <p className="text-lg font-bold text-skin-primary">
                          {latestRound.withoutTrump ? (
                            <span className="text-red-600">Without Trump (2x)</span>
                          ) : (
                            'With Trump'
                          )}
                        </p>
                      </div>
                    </div>
                  </UICard>
                </section>
              )}

              {/* Round Results */}
              {latestRound && (
                <section className="mb-6">
                  <h3 className="text-xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2">
                    <span aria-hidden="true">📊</span> Round Results
                  </h3>
                  <UICard variant="gradient" gradient="primary">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">Offensive Team</p>
                        <p className="font-bold text-skin-primary">Team {latestRound.offensiveTeam}</p>
                      </div>
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">Points Earned</p>
                        <p className="font-bold text-skin-primary">
                          {latestRound.offensivePoints} / {latestRound.betAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">Defensive Points</p>
                        <p className="font-bold text-skin-primary">{latestRound.defensivePoints}</p>
                      </div>
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">Result</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                            latestRound.betMade
                              ? 'bg-green-100 text-green-800 border-green-400'
                              : 'bg-red-100 text-red-800 border-red-400'
                          }`}
                        >
                          {latestRound.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                        </span>
                      </div>
                    </div>
                    <div className="border-t-2 border-indigo-200 pt-3">
                      <p className="text-sm text-indigo-700 font-semibold mb-2">Round Score:</p>
                      <p className="font-bold">
                        <span className="text-team1">
                          Team 1: {latestRound.roundScore.team1 >= 0 ? '+' : ''}
                          {latestRound.roundScore.team1}
                        </span>
                        {' | '}
                        <span className="text-team2">
                          Team 2: {latestRound.roundScore.team2 >= 0 ? '+' : ''}
                          {latestRound.roundScore.team2}
                        </span>
                      </p>
                    </div>
                  </UICard>
                </section>
              )}

              {/* Detailed Trick History */}
              {latestRound?.tricks && latestRound.tricks.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-xl font-bold text-skin-primary mb-4 border-b-2 border-skin-default pb-2">
                    <span aria-hidden="true">🃏</span> Tricks Played
                  </h3>
                  <UICard variant="gradient" gradient="info">
                    {latestRound.trump && (
                      <div className="mb-4 flex items-center justify-center gap-2">
                        <span className="text-sm bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-semibold border-2 border-blue-400">
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
                  </UICard>
                </section>
              )}

              {/* Round Statistics */}
              {statistics && (
                <UICard variant="gradient" gradient="warning" className="mb-4">
                  <h3 className="text-xl font-bold mb-4 text-skin-primary text-center">
                    <span aria-hidden="true">🏅</span> Round Highlights
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {statistics.trickMaster && (
                      <UICard
                        variant="bordered"
                        className="bg-yellow-50 border-2 border-yellow-400"
                      >
                        <div className="text-3xl mb-2 text-center">🏆</div>
                        <p className="text-sm text-yellow-700 text-center">Trick Master</p>
                        <p className="font-bold text-lg text-center text-skin-primary">
                          {statistics.trickMaster.playerName}
                        </p>
                        <p className="text-xs text-yellow-600 text-center">
                          {statistics.trickMaster.tricksWon} tricks
                        </p>
                      </UICard>
                    )}

                    {statistics.pointLeader && (
                      <UICard
                        variant="bordered"
                        className="bg-red-50 border-2 border-red-300"
                      >
                        <div className="text-3xl mb-2 text-center">💎</div>
                        <p className="text-sm text-red-700 text-center">Point Leader</p>
                        <p className="font-bold text-lg text-center text-skin-primary">
                          {statistics.pointLeader.playerName}
                        </p>
                        <p className="text-xs text-red-600 text-center">
                          {statistics.pointLeader.pointsEarned} pts
                        </p>
                      </UICard>
                    )}

                    {statistics.trumpMaster && (
                      <UICard
                        variant="bordered"
                        className="bg-team2-10 border-2 border-team2"
                      >
                        <div className="text-3xl mb-2 text-center">👑</div>
                        <p className="text-sm text-team2 text-center">Trump Master</p>
                        <p className="font-bold text-lg text-center text-skin-primary">
                          {statistics.trumpMaster.playerName}
                        </p>
                        <p className="text-xs text-team2 opacity-80 text-center">
                          {statistics.trumpMaster.trumpsPlayed} trumps played
                        </p>
                      </UICard>
                    )}

                    {statistics.luckyPlayer && (
                      <UICard
                        variant="bordered"
                        className="bg-green-50 border-2 border-green-300"
                      >
                        <div className="text-3xl mb-2 text-center">🍀</div>
                        <p className="text-sm text-green-700 text-center">Lucky Player</p>
                        <p className="font-bold text-lg text-center text-skin-primary">
                          {statistics.luckyPlayer.playerName}
                        </p>
                        <p className="text-xs text-green-600 text-center">
                          {statistics.luckyPlayer.redZeros} red 0
                          {statistics.luckyPlayer.redZeros > 1 ? 's' : ''}
                        </p>
                      </UICard>
                    )}
                  </div>
                </UICard>
              )}
            </div>
          )}
        </UICard>
      </div>
    </div>
  );
}

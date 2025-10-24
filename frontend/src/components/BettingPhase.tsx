import { useMemo, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Bet, Player, GameState } from '../types/game';
import { Card as CardComponent } from './Card';
import { TimeoutIndicator } from './TimeoutIndicator';
import { Leaderboard } from './Leaderboard';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { GameHeader } from './GameHeader';
import { sounds } from '../utils/sounds';

interface BettingPhaseProps {
  players: Player[];
  currentBets: Bet[];
  currentPlayerId: string;
  currentPlayerIndex: number;
  dealerIndex: number;
  onPlaceBet: (amount: number, withoutTrump: boolean, skipped?: boolean) => void;
  onLeaveGame?: () => void;
  gameState: GameState;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  onOpenBotManagement?: () => void;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
}

export function BettingPhase({ players, currentBets, currentPlayerId, currentPlayerIndex, dealerIndex, onPlaceBet, onLeaveGame, gameState, autoplayEnabled = false, onAutoplayToggle, onOpenBotManagement, socket, gameId, chatMessages = [], onNewChatMessage }: BettingPhaseProps) {
  const hasPlacedBet = currentBets.some(b => b.playerId === currentPlayerId);
  const isMyTurn = players[currentPlayerIndex]?.id === currentPlayerId;
  const isDealer = currentPlayerIndex === dealerIndex;

  // Get current player's hand
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const playerHand = currentPlayer?.hand || [];

  // State for bet selection
  const [selectedAmount, setSelectedAmount] = useState<number>(7);
  const [withoutTrump, setWithoutTrump] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Listen for chat messages and update unread count
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      if (!chatOpen) {
        setUnreadChatCount(prev => prev + 1);
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

  // Reset unread count when chat is opened
  useEffect(() => {
    if (chatOpen) {
      setUnreadChatCount(0);
    }
  }, [chatOpen]);

  // Get highest valid bet (excluding skipped bets) - memoized
  const highestBet = useMemo((): Bet | null => {
    const validBets = currentBets.filter(b => !b.skipped);
    if (validBets.length === 0) return null;
    return validBets.reduce((highest, current) => {
      if (current.amount > highest.amount) return current;
      if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) return current;
      return highest;
    });
  }, [currentBets]);

  const canSkip = (): boolean => {
    // Dealer can skip if there are existing valid bets
    // Dealer cannot skip if no one has bet (must bet minimum 7)
    if (isDealer) {
      const hasValidBets = currentBets.some(b => !b.skipped);
      return hasValidBets; // Can skip only if someone has bet
    }
    return true; // Non-dealers can always skip
  };

  const handlePlaceBet = () => {
    onPlaceBet(selectedAmount, withoutTrump, false);
  };

  const handleSkip = () => {
    onPlaceBet(0, false, true);
  };

  // Check if current selection is valid
  const isCurrentBetValid = (): boolean => {
    if (!highestBet) return true; // No bets yet, all valid

    if (isDealer) {
      // Dealer can match or raise
      return selectedAmount >= highestBet.amount;
    } else {
      // Non-dealer must raise (higher amount or same with withoutTrump)
      return selectedAmount > highestBet.amount ||
             (selectedAmount === highestBet.amount && withoutTrump && !highestBet.withoutTrump);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment-400 to-parchment-500 dark:from-gray-800 dark:to-gray-900 flex flex-col">
      <GameHeader
        gameId={gameState.id}
        roundNumber={gameState.roundNumber}
        team1Score={gameState.teamScores.team1}
        team2Score={gameState.teamScores.team2}
        onLeaveGame={onLeaveGame}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenChat={() => setChatOpen(!chatOpen)}
        onOpenBotManagement={onOpenBotManagement}
        botCount={gameState.players.filter(p => p.isBot).length}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        unreadChatCount={unreadChatCount}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-parchment-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg max-w-2xl w-full border-2 border-parchment-400 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-umber-900 dark:text-gray-100 font-serif mb-4">Betting Phase</h2>

      {/* Current Turn Indicator with Timeout */}
      {!hasPlacedBet && (
        <div className={`mb-6 px-3 md:px-4 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold shadow-lg flex items-center justify-center gap-2 flex-wrap ${
          players[currentPlayerIndex]?.teamId === 1
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
            : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
        }`}>
          <span>Waiting for: {players[currentPlayerIndex]?.name}</span>
          <TimeoutIndicator
            duration={60000}
            isActive={!hasPlacedBet && isMyTurn}
            resetKey={currentPlayerIndex}
            onTimeout={() => {
              // Auto-enable autoplay when timeout expires (only for current player)
              if (isMyTurn && onAutoplayToggle && !autoplayEnabled) {
                onAutoplayToggle();
              }
            }}
          />
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-umber-800 dark:text-gray-200">Players & Bets</h3>
        <div className="space-y-2">
          {players.map((player, index) => {
            const bet = currentBets.find(b => b.playerId === player.id);
            const isDealerPlayer = index === dealerIndex;
            return (
              <div key={player.id} className="flex items-center justify-between p-3 bg-parchment-100 dark:bg-gray-700 rounded-lg border border-parchment-300 dark:border-gray-600" data-testid={`player-list-item-${player.name}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${player.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'}`}></span>
                  <span className="font-medium text-umber-900 dark:text-gray-100" data-testid={`player-name-${player.name}`}>
                    {player.name}
                    {isDealerPlayer && <span className="ml-2 text-xs text-umber-600 dark:text-gray-400">(Dealer)</span>}
                  </span>
                </div>
                {bet ? (
                  bet.skipped ? (
                    <span className="text-sm bg-parchment-300 text-umber-600 dark:text-gray-400 px-3 py-1 rounded-full border border-umber-300">
                      Skipped
                    </span>
                  ) : (
                    <span className="text-sm bg-forest-100 text-forest-800 px-3 py-1 rounded-full border border-forest-300">
                      {bet.amount} points {bet.withoutTrump ? '(No Trump)' : ''}
                    </span>
                  )
                ) : (
                  <span className="text-sm text-umber-500">Waiting...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player's Hand Display - 4x2 Grid */}
      {playerHand.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-umber-800 dark:text-gray-200">Your Hand</h3>
          <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
            {playerHand.map((card, index) => (
              <div
                key={`${card.color}-${card.value}-${index}`}
                className="flex justify-center"
              >
                <CardComponent
                  card={card}
                  size="small"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasPlacedBet && (
        <div className="space-y-3 mt-6 pt-6 border-t-2 border-parchment-400 dark:border-gray-600">
          {isMyTurn ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3">
                    Select Bet Amount:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 8, 9, 10, 11, 12].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`py-3 px-4 rounded-lg font-semibold transition-all text-base border-2 ${
                          selectedAmount === amount
                            ? 'bg-umber-600 text-parchment-50 ring-2 ring-umber-400 border-umber-700'
                            : 'bg-parchment-100 dark:bg-gray-700 text-umber-800 dark:text-gray-200 hover:bg-parchment-200 dark:bg-gray-600 border-parchment-400 dark:border-gray-600'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3">
                    Trump Option:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 bg-parchment-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-parchment-200 dark:bg-gray-600 transition-colors border border-parchment-300 dark:border-gray-600">
                      <input
                        type="radio"
                        name="trump"
                        checked={!withoutTrump}
                        onChange={() => setWithoutTrump(false)}
                        className="w-4 h-4 text-umber-600 dark:text-gray-400 focus:ring-umber-500"
                      />
                      <span className="ml-3 text-sm font-medium text-umber-800 dark:text-gray-200">
                        With Trump (1x)
                      </span>
                    </label>
                    <label className="flex items-center p-3 bg-parchment-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-parchment-200 dark:bg-gray-600 transition-colors border border-parchment-300 dark:border-gray-600">
                      <input
                        type="radio"
                        name="trump"
                        checked={withoutTrump}
                        onChange={() => setWithoutTrump(true)}
                        className="w-4 h-4 text-umber-600 dark:text-gray-400 focus:ring-umber-500"
                      />
                      <span className="ml-3 text-sm font-medium text-umber-800 dark:text-gray-200">
                        Without Trump (2x multiplier)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  {canSkip() && (
                    <button
                      data-testid="skip-bet-button"
                      onClick={handleSkip}
                      className="flex-1 py-4 px-6 rounded-xl font-black text-base bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
                    >
                      SKIP
                    </button>
                  )}
                  <button
                    onClick={handlePlaceBet}
                    disabled={!isCurrentBetValid()}
                    className={`flex-1 py-4 px-6 rounded-xl font-black text-base transition-all duration-300 border-2 shadow-lg transform ${
                      isCurrentBetValid()
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-green-800 hover:scale-105'
                        : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed border-gray-400 opacity-60'
                    }`}
                  >
                    Place Bet: {selectedAmount} {withoutTrump ? '(No Trump)' : ''}
                  </button>
                </div>

                {/* Validation message */}
                {!isCurrentBetValid() && highestBet && (
                  <div className="bg-parchment-200 dark:bg-gray-600 border-2 border-umber-400 text-umber-800 dark:text-gray-200 px-3 py-2 rounded-lg text-xs">
                    <strong>Too low:</strong> Current highest is {highestBet.amount} points{highestBet.withoutTrump ? ' (No Trump)' : ''}.
                    {isDealer ? ' You can match or raise.' : ' You must raise.'}
                  </div>
                )}
              </div>

              {isDealer && currentBets.length > 0 && currentBets.some(b => !b.skipped) && (
                <div className="bg-sapphire-50 border-2 border-sapphire-300 text-sapphire-800 px-3 py-2 rounded-lg text-xs">
                  <strong>Dealer:</strong> You can match or raise
                </div>
              )}

              {isDealer && !currentBets.some(b => !b.skipped) && (
                <div className="bg-parchment-200 dark:bg-gray-600 border-2 border-umber-400 text-umber-800 dark:text-gray-200 px-3 py-2 rounded-lg text-xs">
                  <strong>Dealer:</strong> Must bet (min 7 points)
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-umber-700 dark:text-gray-300 font-medium py-3 text-sm">
              <span>It's {players[currentPlayerIndex]?.name}'s turn to bet</span>
            </div>
          )}
        </div>
      )}

      {hasPlacedBet && (
        <div className="text-center text-forest-700 font-medium mt-6 pt-6 border-t-2 border-parchment-400 dark:border-gray-600">
          Waiting for other players to bet...
        </div>
      )}
        </div>
      </div>

      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {socket && gameId && onNewChatMessage && (
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
    </div>
  );
}

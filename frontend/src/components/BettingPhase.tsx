import { useMemo, useState, useEffect, memo } from 'react';
import { Socket } from 'socket.io-client';
import { Bet, Player, GameState } from '../types/game';
import { Card as CardComponent } from './Card';
import { TimeoutIndicator } from './TimeoutIndicator';
import { Leaderboard } from './Leaderboard';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { GameHeader } from './GameHeader';
import { sounds } from '../utils/sounds';
import { InlineBetStatus } from './InlineBetStatus';
import { SmartValidationMessage } from './SmartValidationMessage';

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
  onOpenAchievements?: () => void; // Sprint 2 Phase 1
  onOpenFriends?: () => void; // Sprint 2 Phase 2
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
}

function BettingPhaseComponent({ players, currentBets, currentPlayerId, currentPlayerIndex, dealerIndex, onPlaceBet, onLeaveGame, gameState, autoplayEnabled = false, onAutoplayToggle, onOpenBotManagement, onOpenAchievements, onOpenFriends, socket, gameId, chatMessages = [], onNewChatMessage }: BettingPhaseProps) {
  // Memoize expensive computations
  const hasPlacedBet = useMemo(
    () => currentBets.some(b => b.playerId === currentPlayerId),
    [currentBets, currentPlayerId]
  );

  const isMyTurn = useMemo(
    () => players[currentPlayerIndex]?.id === currentPlayerId,
    [players, currentPlayerIndex, currentPlayerId]
  );

  const isDealer = useMemo(
    () => currentPlayerIndex === dealerIndex,
    [currentPlayerIndex, dealerIndex]
  );

  // Get current player's hand
  const currentPlayer = useMemo(
    () => players.find(p => p.id === currentPlayerId),
    [players, currentPlayerId]
  );

  const playerHand = useMemo(
    () => currentPlayer?.hand || [],
    [currentPlayer]
  );

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
    // Dealer can NEVER skip (must match/raise if bets exist, or bet minimum 7 if all skipped)
    // Non-dealers can always skip (if no bets yet) or must raise
    if (isDealer) {
      return false; // Dealer can never skip
    }
    return true; // Non-dealers can always skip
  };

  const handlePlaceBet = () => {
    sounds.betPlaced(); // Sprint 1 Phase 6: Bet placed sound
    onPlaceBet(selectedAmount, withoutTrump, false);
  };

  const handleSkip = () => {
    sounds.betSkipped(); // Sprint 1 Phase 6: Skip sound
    onPlaceBet(-1, false, true);
  };

  // Check if a specific bet amount is valid (for button disabling)
  const isBetAmountValid = (amount: number): boolean => {
    if (!highestBet) return true; // No bets yet, all amounts valid

    if (isDealer) {
      // Dealer can match or raise
      return amount >= highestBet.amount;
    } else {
      // Non-dealer must raise (strictly greater)
      // Note: They could match with withoutTrump, but we disable the button to encourage raising
      return amount > highestBet.amount;
    }
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
        onOpenAchievements={onOpenAchievements}
        onOpenFriends={onOpenFriends}
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
        <div className="relative mb-6">
          {/* Spotlight effect for current player */}
          {isMyTurn && (
            <div className="absolute inset-0 -m-4 rounded-full bg-gradient-radial from-blue-400/30 via-blue-400/10 to-transparent motion-safe:animate-spotlight motion-reduce:opacity-30 pointer-events-none" />
          )}
          <div className={`relative px-3 md:px-4 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold shadow-lg flex items-center justify-center gap-2 flex-wrap transition-all ${
            players[currentPlayerIndex]?.teamId === 1
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
          } ${isMyTurn ? 'border-4 border-blue-500 motion-safe:animate-turn-pulse' : ''}`}>
            {isMyTurn && (
              <span className="motion-safe:animate-arrow-bounce motion-reduce:inline">👇</span>
            )}
            <span>Waiting for: {players[currentPlayerIndex]?.name}{isMyTurn ? ' (Your Turn)' : ''}</span>
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
        </div>
      )}

      {/* Inline Bet Status - Compact horizontal display */}
      <div className="mb-6">
        <InlineBetStatus
          players={players}
          currentBets={new Map(currentBets.map(b => [b.playerId, { amount: b.amount, withoutTrump: b.withoutTrump }]))}
          skippedPlayers={new Set(currentBets.filter(b => b.skipped).map(b => b.playerId))}
          currentPlayerIndex={currentPlayerIndex}
        />
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
                    {[7, 8, 9, 10, 11, 12].map((amount) => {
                      const isValid = isBetAmountValid(amount);
                      return (
                        <button
                          key={amount}
                          onClick={() => setSelectedAmount(amount)}
                          disabled={!isValid}
                          className={`py-3 px-4 rounded-lg font-semibold transition-all text-base border-2 ${
                            !isValid
                              ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed opacity-50 border-gray-400'
                              : selectedAmount === amount
                                ? 'bg-umber-600 text-parchment-50 ring-2 ring-umber-400 border-umber-700'
                                : 'bg-parchment-100 dark:bg-gray-700 text-umber-800 dark:text-gray-200 hover:bg-parchment-200 dark:bg-gray-600 border-parchment-400 dark:border-gray-600'
                          }`}
                        >
                          {amount}
                        </button>
                      );
                    })}
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
              </div>

              {/* Smart Validation Messages - Single priority-based display */}
              <SmartValidationMessage
                messages={[
                  ...(!isCurrentBetValid() && highestBet ? [{
                    type: 'warning' as const,
                    text: `Too low: Current highest is ${highestBet.amount} points${highestBet.withoutTrump ? ' (No Trump)' : ''}. ${isDealer ? 'You can match or raise.' : 'You must raise.'}`
                  }] : []),
                  ...(isDealer && currentBets.length > 0 && currentBets.some(b => !b.skipped) ? [{
                    type: 'info' as const,
                    text: 'Dealer Privilege: You can match or raise the current bet'
                  }] : []),
                  ...(isDealer && !currentBets.some(b => !b.skipped) ? [{
                    type: 'info' as const,
                    text: 'Dealer: You must bet at least 7 points'
                  }] : []),
                  ...(isCurrentBetValid() ? [{
                    type: 'success' as const,
                    text: `Ready to place bet: ${selectedAmount} ${withoutTrump ? '(No Trump)' : ''}`
                  }] : [])
                ]}
              />
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

// Export memoized component to prevent unnecessary re-renders
// Only re-render when bets, players, or critical props change
export const BettingPhase = memo(BettingPhaseComponent);

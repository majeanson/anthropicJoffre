import { useMemo } from 'react';
import { Bet, Player } from '../types/game';
import { Card as CardComponent } from './Card';

interface BettingPhaseProps {
  players: Player[];
  currentBets: Bet[];
  currentPlayerId: string;
  currentPlayerIndex: number;
  dealerIndex: number;
  onPlaceBet: (amount: number, withoutTrump: boolean, skipped?: boolean) => void;
  onLeaveGame?: () => void;
}

export function BettingPhase({ players, currentBets, currentPlayerId, currentPlayerIndex, dealerIndex, onPlaceBet, onLeaveGame }: BettingPhaseProps) {
  const hasPlacedBet = currentBets.some(b => b.playerId === currentPlayerId);
  const isMyTurn = players[currentPlayerIndex]?.id === currentPlayerId;
  const isDealer = currentPlayerIndex === dealerIndex;

  // Get current player's hand
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const playerHand = currentPlayer?.hand || [];

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

  const handleBetClick = (amount: number, withoutTrump: boolean) => {
    onPlaceBet(amount, withoutTrump, false);
  };

  const handleSkip = () => {
    onPlaceBet(0, false, true);
  };

  // Check if a bet option is valid
  const isBetValid = (amount: number, withoutTrump: boolean): boolean => {
    if (!highestBet) return true; // No bets yet, all valid

    if (isDealer) {
      // Dealer can match or raise
      return amount >= highestBet.amount;
    } else {
      // Non-dealer must raise (higher amount or same with withoutTrump)
      return amount > highestBet.amount ||
             (amount === highestBet.amount && withoutTrump && !highestBet.withoutTrump);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl mx-auto relative">
      {onLeaveGame && (
        <button
          onClick={onLeaveGame}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
          title="Leave Game"
        >
          🚪 Leave
        </button>
      )}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Betting Phase</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Players & Bets</h3>
        <div className="space-y-2">
          {players.map((player, index) => {
            const bet = currentBets.find(b => b.playerId === player.id);
            const isDealerPlayer = index === dealerIndex;
            return (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${player.teamId === 1 ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">
                    {player.name}
                    {isDealerPlayer && <span className="ml-2 text-xs text-purple-600">(Dealer)</span>}
                  </span>
                </div>
                {bet ? (
                  bet.skipped ? (
                    <span className="text-sm bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                      Skipped
                    </span>
                  ) : (
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {bet.amount} points {bet.withoutTrump ? '(No Trump)' : ''}
                    </span>
                  )
                ) : (
                  <span className="text-sm text-gray-500">Waiting...</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!hasPlacedBet && (
        <div className="space-y-3">
          {isMyTurn ? (
            <>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Select Your Bet:
                </label>

                {/* Skip Button */}
                {canSkip() && (
                  <button
                    data-testid="skip-bet-button"
                    onClick={handleSkip}
                    className="w-full py-2 px-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
                  >
                    SKIP
                  </button>
                )}

                {/* Compact Bet buttons - 3 columns on mobile */}
                <div className="grid grid-cols-3 md:grid-cols-2 gap-1.5 md:gap-2">
                  {[7, 8, 9, 10, 11, 12].map((amount) => {
                    const withTrumpValid = isBetValid(amount, false);
                    const withoutTrumpValid = isBetValid(amount, true);

                    return (
                      <div key={amount} className="contents">
                        {/* With Trump - Mobile: Single column, Desktop: Left column */}
                        <button
                          data-testid={`bet-${amount}-with-trump`}
                          onClick={() => handleBetClick(amount, false)}
                          disabled={!withTrumpValid}
                          className={`py-2 px-2 md:px-3 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                            withTrumpValid
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {amount}
                        </button>

                        {/* Without Trump - Hidden on mobile, shown on desktop */}
                        <button
                          data-testid={`bet-${amount}-without-trump`}
                          onClick={() => handleBetClick(amount, true)}
                          disabled={!withoutTrumpValid}
                          className={`hidden md:block py-2 px-3 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                            withoutTrumpValid
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {amount} (No Trump)
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile: No Trump variants as separate row */}
                <div className="md:hidden">
                  <p className="text-xs text-gray-600 mb-1.5 font-medium">No Trump (2x):</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[7, 8, 9, 10, 11, 12].map((amount) => {
                      const withoutTrumpValid = isBetValid(amount, true);
                      return (
                        <button
                          key={amount}
                          data-testid={`bet-${amount}-without-trump`}
                          onClick={() => handleBetClick(amount, true)}
                          disabled={!withoutTrumpValid}
                          className={`py-2 px-2 rounded-lg font-semibold transition-colors text-sm ${
                            withoutTrumpValid
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {amount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {isDealer && currentBets.length > 0 && currentBets.some(b => !b.skipped) && (
                <div className="bg-purple-50 border border-purple-200 text-purple-800 px-3 py-2 rounded-lg text-xs">
                  <strong>Dealer:</strong> You can match or raise
                </div>
              )}

              {isDealer && !currentBets.some(b => !b.skipped) && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-xs">
                  <strong>Dealer:</strong> Must bet (min 7 points)
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600 font-medium py-3 text-sm">
              Waiting for {players[currentPlayerIndex]?.name}'s bet...
            </div>
          )}
        </div>
      )}

      {hasPlacedBet && (
        <div className="text-center text-green-600 font-medium">
          Waiting for other players to bet...
        </div>
      )}

      {/* Player's Hand Display - 4x2 Grid */}
      {playerHand.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Your Hand</h3>
          <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
            {playerHand.map((card, index) => (
              <div
                key={`${card.color}-${card.value}-${index}`}
                className="flex justify-center"
              >
                <CardComponent
                  card={card}
                  size="small"
                  disabled={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

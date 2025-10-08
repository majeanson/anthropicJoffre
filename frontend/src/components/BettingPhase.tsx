import { useState, useEffect } from 'react';
import { Bet, Player } from '../types/game';

interface BettingPhaseProps {
  players: Player[];
  currentBets: Bet[];
  currentPlayerId: string;
  currentPlayerIndex: number;
  dealerIndex: number;
  onPlaceBet: (amount: number, withoutTrump: boolean, skipped?: boolean) => void;
}

export function BettingPhase({ players, currentBets, currentPlayerId, currentPlayerIndex, dealerIndex, onPlaceBet }: BettingPhaseProps) {
  const [betAmount, setBetAmount] = useState<number>(7);
  const [withoutTrump, setWithoutTrump] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  const hasPlacedBet = currentBets.some(b => b.playerId === currentPlayerId);
  const isMyTurn = players[currentPlayerIndex]?.id === currentPlayerId;
  const isDealer = currentPlayerIndex === dealerIndex;

  // Get highest valid bet (excluding skipped bets)
  const getHighestBet = (): Bet | null => {
    const validBets = currentBets.filter(b => !b.skipped);
    if (validBets.length === 0) return null;
    return validBets.reduce((highest, current) => {
      if (current.amount > highest.amount) return current;
      if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) return current;
      return highest;
    });
  };

  const highestBet = getHighestBet();

  // Validate bet amount
  const isBetValid = (): boolean => {
    if (!highestBet) return true; // First bet, any amount valid

    if (isDealer) {
      // Dealer can match or raise
      if (betAmount < highestBet.amount) {
        setValidationMessage(`As dealer, you must match or raise. Minimum: ${highestBet.amount}`);
        return false;
      }
    } else {
      // Non-dealer must raise
      const newBetIsHigher =
        betAmount > highestBet.amount ||
        (betAmount === highestBet.amount && withoutTrump && !highestBet.withoutTrump);

      if (!newBetIsHigher) {
        setValidationMessage(
          `You must raise the bet. Minimum: ${highestBet.amount}${!highestBet.withoutTrump ? ' (or ' + highestBet.amount + ' without trump)' : ''}`
        );
        return false;
      }
    }

    setValidationMessage('');
    return true;
  };

  const canSkip = (): boolean => {
    // Dealer cannot skip if there are existing bets
    if (isDealer && currentBets.length > 0 && currentBets.some(b => !b.skipped)) {
      return false;
    }
    return true;
  };

  // Update validation when bet amount or withoutTrump changes
  useEffect(() => {
    if (isMyTurn && highestBet) {
      isBetValid();
    }
  }, [betAmount, withoutTrump, isMyTurn]);

  const handleSkip = () => {
    onPlaceBet(0, false, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBetValid()) return;
    onPlaceBet(betAmount, withoutTrump, false);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bet Amount (7-12 points)
            </label>
            <input
              type="range"
              min="7"
              max="12"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full"
              disabled={!isMyTurn}
            />
            <div className="text-center text-2xl font-bold text-blue-600 mt-2">
              {betAmount}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="withoutTrump"
              checked={withoutTrump}
              onChange={(e) => setWithoutTrump(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              disabled={!isMyTurn}
            />
            <label htmlFor="withoutTrump" className="text-sm font-medium text-gray-700">
              Without Trump (Double points)
            </label>
          </div>

          {validationMessage && isMyTurn && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              {validationMessage}
            </div>
          )}

          {isMyTurn ? (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!isBetValid()}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  isBetValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Place Bet
              </button>
              {canSkip() && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-600 font-medium py-3">
              Waiting for {players[currentPlayerIndex]?.name}'s bet...
            </div>
          )}

          {isDealer && currentBets.length > 0 && currentBets.some(b => !b.skipped) && (
            <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg text-sm">
              <strong>Dealer Privilege:</strong> You can match the highest bet or raise it.
            </div>
          )}
        </form>
      )}

      {hasPlacedBet && (
        <div className="text-center text-green-600 font-medium">
          Waiting for other players to bet...
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Bet, Player } from '../types/game';

interface BettingPhaseProps {
  players: Player[];
  currentBets: Bet[];
  currentPlayerId: string;
  onPlaceBet: (amount: number, withoutTrump: boolean) => void;
}

export function BettingPhase({ players, currentBets, currentPlayerId, onPlaceBet }: BettingPhaseProps) {
  const [betAmount, setBetAmount] = useState<number>(7);
  const [withoutTrump, setWithoutTrump] = useState(false);

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasPlacedBet = currentBets.some(b => b.playerId === currentPlayerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceBet(betAmount, withoutTrump);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Betting Phase</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Players & Bets</h3>
        <div className="space-y-2">
          {players.map(player => {
            const bet = currentBets.find(b => b.playerId === player.id);
            return (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${player.teamId === 1 ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">{player.name}</span>
                </div>
                {bet ? (
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    {bet.amount} tricks {bet.withoutTrump ? '(No Trump)' : ''}
                  </span>
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
              Bet Amount (7-12 tricks)
            </label>
            <input
              type="range"
              min="7"
              max="12"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full"
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
            />
            <label htmlFor="withoutTrump" className="text-sm font-medium text-gray-700">
              Without Trump (Double points)
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Place Bet
          </button>
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

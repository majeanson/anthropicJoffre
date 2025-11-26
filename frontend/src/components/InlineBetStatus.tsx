import { Player } from '../types/game';

interface InlineBetStatusProps {
  players: Player[];
  currentBets: Map<string, { amount: number; withoutTrump: boolean }>;
  skippedPlayers: Set<string>;
  currentPlayerIndex: number;
  onClickPlayer?: (playerName: string) => void;
}

export function InlineBetStatus({
  players,
  currentBets,
  skippedPlayers,
  currentPlayerIndex,
  onClickPlayer
}: InlineBetStatusProps) {
  const getBetDisplay = (player: Player): { icon: string; text: string; color: string } => {
    const bet = currentBets.get(player.name);
    const isCurrentPlayer = players[currentPlayerIndex]?.id === player.id;

    if (bet) {
      return {
        icon: '✓',
        text: `${bet.amount}${bet.withoutTrump ? '*' : ''}`,
        color: player.teamId === 1
          ? 'bg-orange-500/80 dark:bg-orange-600/80 text-white'
          : 'bg-purple-500/80 dark:bg-purple-600/80 text-white'
      };
    }

    if (skippedPlayers.has(player.name)) {
      return {
        icon: '⊗',
        text: 'skip',
        color: 'bg-gray-400 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
      };
    }

    if (isCurrentPlayer) {
      return {
        icon: '⏳',
        text: '?',
        color: player.teamId === 1
          ? 'bg-orange-300 dark:bg-orange-400 text-orange-900'
          : 'bg-purple-300 dark:bg-purple-400 text-purple-900'
      };
    }

    return {
      icon: '○',
      text: '?',
      color: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    };
  };

  return (
    <div
      className="bg-parchment-100 dark:bg-gray-800 border border-umber-700 dark:border-gray-600 rounded-lg px-3 py-3 shadow-md"
      data-testid="inline-bet-status"
    >
      <div className="text-umber-700 dark:text-gray-400 font-semibold text-sm mb-2 text-center">
        Bets
      </div>
      <div className="space-y-2">
        {players.map((player) => {
          const display = getBetDisplay(player);
          const isClickable = !player.isEmpty && !player.isBot && onClickPlayer;

          // Debug logging
          if (player.name) {
            console.log(`[InlineBetStatus] Player: ${player.name}, isEmpty: ${player.isEmpty}, isBot: ${player.isBot}, onClickPlayer: ${!!onClickPlayer}, isClickable: ${isClickable}`);
          }

          return (
            <div
              key={player.id}
              className={`${display.color} px-3 py-2 rounded font-semibold flex items-center justify-between transition-all shadow-sm`}
              data-testid={`bet-status-${player.name}`}
              title={`${player.name} - ${display.text === '?' ? 'Waiting' : display.text === 'skip' ? 'Skipped' : `Bet: ${display.text}`}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{display.icon}</span>
                {isClickable ? (
                  <button
                    onClick={() => onClickPlayer(player.name)}
                    className="font-bold hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-1 -mx-1"
                    data-testid={`player-name-${player.name}`}
                    title={`View ${player.name}'s profile`}
                  >
                    {player.name}
                  </button>
                ) : (
                  <span className="font-bold" data-testid={`player-name-${player.name}`}>{player.name}</span>
                )}
              </div>
              <span className="font-black text-lg">{display.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Player } from '../types/game';

interface InlineBetStatusProps {
  players: Player[];
  currentBets: Map<string, { amount: number; withoutTrump: boolean }>;
  skippedPlayers: Set<string>;
  currentPlayerIndex: number;
}

export function InlineBetStatus({
  players,
  currentBets,
  skippedPlayers,
  currentPlayerIndex
}: InlineBetStatusProps) {
  const getBetDisplay = (player: Player): { icon: string; text: string; color: string } => {
    const bet = currentBets.get(player.id);
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

    if (skippedPlayers.has(player.id)) {
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
      className="bg-parchment-100 dark:bg-gray-800 border border-umber-700 dark:border-gray-600 rounded-lg px-3 py-2 shadow-md"
      data-testid="inline-bet-status"
    >
      <div className="flex items-center justify-center flex-wrap gap-2 text-sm">
        <span className="text-umber-700 dark:text-gray-400 font-semibold text-xs mr-1">
          Bets:
        </span>
        {players.map((player) => {
          const display = getBetDisplay(player);
          return (
            <div
              key={player.id}
              className={`${display.color} px-2 py-1 rounded font-semibold flex items-center gap-1 transition-all shadow-sm`}
              data-testid={`bet-status-${player.name}`}
              title={`${player.name} - ${display.text === '?' ? 'Waiting' : display.text === 'skip' ? 'Skipped' : `Bet: ${display.text}`}`}
            >
              <span className="text-xs">{display.icon}</span>
              <span>{player.name}</span>
              <span className="font-bold">{display.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Player } from '../types/game';
import { UICard, Button } from './ui';

interface InlineBetStatusProps {
  players: Player[];
  currentBets: Map<string, { amount: number; withoutTrump: boolean }>;
  skippedPlayers: Set<string>;
  currentPlayerIndex: number;
  onClickPlayer: (playerName: string) => void; // REQUIRED - Click player to view profile
}

export function InlineBetStatus({
  players,
  currentBets,
  skippedPlayers,
  currentPlayerIndex,
  onClickPlayer,
}: InlineBetStatusProps) {
  const getBetDisplay = (player: Player): { icon: string; text: string; color: string } => {
    const bet = currentBets.get(player.name);
    const isCurrentPlayer = players[currentPlayerIndex]?.id === player.id;

    if (bet) {
      return {
        icon: '✓',
        text: `${bet.amount}${bet.withoutTrump ? '*' : ''}`,
        color:
          player.teamId === 1
            ? 'bg-team1/80 text-white'
            : 'bg-team2/80 text-white',
      };
    }

    if (skippedPlayers.has(player.name)) {
      return {
        icon: '⊗',
        text: 'skip',
        color: 'bg-skin-tertiary text-skin-secondary',
      };
    }

    if (isCurrentPlayer) {
      return {
        icon: '⏳',
        text: '?',
        color:
          player.teamId === 1
            ? 'bg-team1/50 text-team1'
            : 'bg-team2/50 text-team2',
      };
    }

    return {
      icon: '○',
      text: '?',
      color: 'bg-skin-tertiary text-skin-secondary',
    };
  };

  return (
    <UICard
      variant="bordered"
      size="sm"
      className="bg-skin-secondary border-skin-default"
      data-testid="inline-bet-status"
    >
      <div className="text-skin-muted font-semibold text-sm mb-2 text-center">
        Bets
      </div>
      <div className="space-y-2">
        {players.map((player) => {
          const display = getBetDisplay(player);
          // Real players (not bots or empty seats) are clickable to view profiles
          const isClickable = !player.isEmpty && !player.isBot;

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
                  <Button
                    onClick={() => onClickPlayer(player.name)}
                    variant="link"
                    size="sm"
                    className="font-bold !p-0 !px-1 !-mx-1"
                    data-testid={`player-name-${player.name}`}
                    title={`View ${player.name}'s profile`}
                  >
                    {player.name}
                  </Button>
                ) : (
                  <span className="font-bold" data-testid={`player-name-${player.name}`}>
                    {player.name}
                  </span>
                )}
              </div>
              <span className="font-black text-lg">{display.text}</span>
            </div>
          );
        })}
      </div>
    </UICard>
  );
}

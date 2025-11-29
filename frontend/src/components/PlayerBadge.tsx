import { UIBadge } from './ui/UIBadge';

interface PlayerBadgeProps {
  name: string;
  teamId: 1 | 2;
  isBot?: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isThinking?: boolean;
  isCurrentTurn?: boolean;
  compact?: boolean;
}

export function PlayerBadge({
  name,
  teamId,
  isBot = false,
  botDifficulty,
  isThinking = false,
  isCurrentTurn = false,
  compact = true
}: PlayerBadgeProps) {
  const teamColor = teamId === 1 ? 'team1' : 'team2';

  const difficultyIcon = isBot && botDifficulty ? {
    'easy': '🟢',
    'medium': '🟡',
    'hard': '🔴'
  }[botDifficulty] : null;

  if (compact) {
    return (
      <div
        className={`flex flex-col items-center gap-0.5 ${isCurrentTurn ? 'scale-110' : ''} transition-transform`}
        data-testid={`player-badge-${name}`}
      >
        <UIBadge variant="solid" color={teamColor} size="xs">
          {name}
        </UIBadge>
        <div className="flex items-center gap-0.5">
          {isBot && (
            <span className="text-sm" title={`Bot (${botDifficulty})`}>🤖</span>
          )}
          {difficultyIcon && (
            <span className="text-xs" title={botDifficulty}>
              {difficultyIcon}
            </span>
          )}
          {isThinking && (
            <span className="text-xs animate-pulse" title="Thinking...">💭</span>
          )}
        </div>
      </div>
    );
  }

  // Non-compact version for backwards compatibility
  return (
    <div
      className="flex items-center gap-2"
      data-testid={`player-badge-${name}`}
    >
      <UIBadge variant="solid" color={teamColor} size="sm">
        {name}
        {isBot && <span title={`Bot (${botDifficulty})`}> 🤖</span>}
        {isThinking && <span title="Thinking..." className="animate-pulse"> 💭</span>}
        {isCurrentTurn && <span className="text-green-300"> (Your Turn)</span>}
      </UIBadge>
    </div>
  );
}

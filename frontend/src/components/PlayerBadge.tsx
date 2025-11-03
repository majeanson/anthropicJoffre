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
  const teamColor = teamId === 1
    ? 'bg-orange-500 dark:bg-orange-600'
    : 'bg-purple-500 dark:bg-purple-600';

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
        <div className={`${teamColor} px-2 py-1 rounded text-white text-xs font-semibold shadow-md`}>
          {name}
        </div>
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
      className={`${teamColor} px-3 py-1.5 rounded-lg text-white text-sm font-semibold shadow-md flex items-center gap-2`}
      data-testid={`player-badge-${name}`}
    >
      <span>{name}</span>
      {isBot && <span title={`Bot (${botDifficulty})`}>🤖</span>}
      {isThinking && <span title="Thinking..." className="animate-pulse">💭</span>}
      {isCurrentTurn && <span className="text-green-300">(Your Turn)</span>}
    </div>
  );
}

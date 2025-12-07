import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { UICard, Button, TeamIndicator } from './ui';

interface RematchVotingProps {
  socket: Socket | null;
  gameId: string;
  gameState: GameState;
  currentPlayerId: string;
}

export function RematchVoting({ socket, gameId, gameState, currentPlayerId }: RematchVotingProps) {
  const rematchVotes = gameState.rematchVotes || [];

  // Find current player to get their name (rematchVotes now stores names, not IDs)
  const currentPlayer = gameState.players.find(
    (p) => p.name === currentPlayerId || p.id === currentPlayerId
  );
  const currentPlayerName = currentPlayer?.name || '';
  const hasVoted = rematchVotes.includes(currentPlayerName);
  const votesNeeded = 4 - rematchVotes.length;

  const handleVoteRematch = () => {
    if (!socket || hasVoted) return;
    socket.emit('vote_rematch', { gameId });
  };

  return (
    <UICard variant="elevated" size="lg" className="max-w-2xl mx-auto">
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-black text-umber-900 dark:text-gray-100 font-serif">
          Play Again?
        </h2>

        <UICard variant="bordered" size="md" className="bg-white dark:bg-gray-800/50">
          <div className="text-6xl mb-4" aria-hidden="true">
            {rematchVotes.length === 4 ? '🎉' : '🔄'}
          </div>

          <div className="space-y-2">
            <p className="text-2xl font-bold text-umber-900 dark:text-gray-100">
              {rematchVotes.length} / 4 votes
            </p>
            {votesNeeded > 0 ? (
              <p className="text-lg text-umber-700 dark:text-gray-300">
                {votesNeeded === 1 ? '1 more vote needed!' : `${votesNeeded} more votes needed`}
              </p>
            ) : (
              <p className="text-lg text-forest-700 font-bold animate-pulse">Starting rematch...</p>
            )}
          </div>

          {/* Vote indicators */}
          <div className="flex justify-center gap-3 mt-6">
            {gameState.players.map((player) => {
              const voted = rematchVotes.includes(player.name);
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    voted
                      ? 'bg-forest-100 border-forest-400'
                      : 'bg-parchment-200 dark:bg-gray-600 border-parchment-400 dark:border-gray-600 dark:border-gray-500 opacity-60'
                  }`}
                  title={player.name}
                >
                  <TeamIndicator teamId={player.teamId} size="md" className="mb-2" />
                  <div className="text-xs font-bold text-umber-900 dark:text-gray-100 max-w-[60px] truncate">
                    {isCurrentPlayer ? 'You' : player.name}
                  </div>
                  <div className="text-2xl mt-1">{voted ? '✓' : '○'}</div>
                </div>
              );
            })}
          </div>
        </UICard>

        {!hasVoted && (
          <Button
            variant="success"
            size="lg"
            onClick={handleVoteRematch}
            className="w-full text-xl font-black"
          >
            Vote for Rematch
          </Button>
        )}

        {hasVoted && votesNeeded > 0 && (
          <UICard variant="bordered" size="sm" gradient="info">
            <p className="font-semibold text-blue-800 dark:text-blue-200">
              ✓ You voted for rematch. Waiting for other players...
            </p>
          </UICard>
        )}
      </div>
    </UICard>
  );
}

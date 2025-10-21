import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';

interface RematchVotingProps {
  socket: Socket | null;
  gameId: string;
  gameState: GameState;
  currentPlayerId: string;
}

export function RematchVoting({ socket, gameId, gameState, currentPlayerId }: RematchVotingProps) {
  const rematchVotes = gameState.rematchVotes || [];
  const hasVoted = rematchVotes.includes(currentPlayerId);
  const votesNeeded = 4 - rematchVotes.length;

  const handleVoteRematch = () => {
    if (!socket || hasVoted) return;
    socket.emit('vote_rematch', { gameId });
  };

  return (
    <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto border-4 border-amber-700 dark:border-gray-600">
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-black text-umber-900 dark:text-gray-100 font-serif">
          Play Again?
        </h2>

        <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border-2 border-amber-600">
          <div className="text-6xl mb-4">
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
              <p className="text-lg text-forest-700 font-bold animate-pulse">
                Starting rematch...
              </p>
            )}
          </div>

          {/* Vote indicators */}
          <div className="flex justify-center gap-3 mt-6">
            {gameState.players.map((player) => {
              const voted = rematchVotes.includes(player.id);
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
                  <div className={`w-3 h-3 rounded-full mb-2 ${
                    player.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'
                  }`} />
                  <div className="text-xs font-bold text-umber-900 dark:text-gray-100 max-w-[60px] truncate">
                    {isCurrentPlayer ? 'You' : player.name}
                  </div>
                  <div className="text-2xl mt-1">
                    {voted ? '✓' : '○'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!hasVoted && (
          <button
            onClick={handleVoteRematch}
            className="w-full py-4 px-8 rounded-xl font-black text-xl bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105"
          >
            Vote for Rematch
          </button>
        )}

        {hasVoted && votesNeeded > 0 && (
          <div className="bg-blue-50 border-2 border-blue-400 text-blue-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">
              ✓ You voted for rematch. Waiting for other players...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

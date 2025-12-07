import { Socket } from 'socket.io-client';
import { GameState } from '../../types/game';
import { Button } from '../ui';

interface AutomationTabProps {
  gameState: GameState | null;
  gameId: string;
  socket: Socket | null;
}

export function AutomationTab({ gameState, gameId, socket }: AutomationTabProps) {
  const isPlayingPhase = gameState && gameState.phase === 'playing';
  const isBettingPhase = gameState && gameState.phase === 'betting';

  if (!isPlayingPhase && !isBettingPhase) {
    return (
      <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-8 text-center animate-slide-in">
        <p className="text-gray-400 text-lg">
          No automation controls available for{' '}
          <span className="font-semibold text-white">
            {gameState ? gameState.phase.replace('_', ' ') : 'current'}
          </span>{' '}
          phase
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Automation is available during betting and playing phases
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      {isPlayingPhase && (
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎮</span>
            <span className="font-semibold text-green-300">Playing Phase Controls</span>
            <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs font-semibold rounded-full">
              ACTIVE
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => socket?.emit('debug_auto_play_card', { gameId })}
              disabled={!socket}
              variant="primary"
              size="md"
            >
              🤖 Auto-Play Card
            </Button>
            <Button
              onClick={() => socket?.emit('debug_skip_trick', { gameId })}
              disabled={!socket || gameState.currentTrick.length === 0}
              variant="warning"
              size="md"
            >
              ⏭️ Skip Trick
            </Button>
            <Button
              onClick={() => {
                if (window.confirm('Skip entire round? Auto-play all remaining cards.')) {
                  socket?.emit('debug_skip_round', { gameId });
                }
              }}
              disabled={!socket}
              variant="secondary"
              size="md"
            >
              ⏭️⏭️ Skip Round
            </Button>
          </div>
          <p className="text-xs text-green-300 mt-3">
            Auto-play cards for current player. Use for testing game flow.
          </p>
        </div>
      )}

      {isBettingPhase && (
        <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border-2 border-orange-500/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💰</span>
            <span className="font-semibold text-orange-300">Betting Phase Controls</span>
            <span className="px-2 py-0.5 bg-orange-500/30 text-orange-300 text-xs font-semibold rounded-full">
              ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Button
              onClick={() => socket?.emit('debug_auto_bet', { gameId })}
              disabled={!socket}
              variant="primary"
              size="md"
            >
              💰 Auto-Bet
            </Button>
            <Button
              onClick={() => {
                if (window.confirm('Skip betting phase? Auto-bet for all players.')) {
                  socket?.emit('debug_skip_betting', { gameId });
                }
              }}
              disabled={!socket}
              variant="secondary"
              size="md"
            >
              ⏭️ Skip Betting
            </Button>
          </div>

          <div className="border-t-2 border-orange-500/30 pt-4">
            <p className="text-sm font-semibold text-orange-300 mb-2">Force Bet Override</p>
            <div className="grid grid-cols-12 gap-2">
              {[7, 8, 9, 10, 11, 12].map((amount) => (
                <div key={amount} className="col-span-6 md:col-span-2 flex flex-col gap-1">
                  <Button
                    onClick={() =>
                      socket?.emit('debug_force_bet', { gameId, amount, withoutTrump: false })
                    }
                    disabled={!socket}
                    variant="warning"
                    size="sm"
                  >
                    {amount}
                  </Button>
                  <Button
                    onClick={() =>
                      socket?.emit('debug_force_bet', { gameId, amount, withoutTrump: true })
                    }
                    disabled={!socket}
                    variant="danger"
                    size="sm"
                  >
                    {amount} 🚫
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-300 mt-2">
              Force bet for current player. 🚫 = Without Trump (2x multiplier)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

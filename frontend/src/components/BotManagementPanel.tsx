import { memo, useState } from 'react';
import { GameState, BotDifficulty } from '../types/game';

interface BotManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState | null;
  currentPlayerId: string;
  onReplaceWithBot: (playerName: string) => void;
  onChangeBotDifficulty: (botName: string, difficulty: BotDifficulty) => void;
  onKickPlayer?: (playerId: string) => void;
  onSwapPosition?: (targetPlayerId: string) => void;
  creatorId?: string;
}

export const BotManagementPanel = memo(function BotManagementPanel({
  isOpen,
  onClose,
  gameState,
  currentPlayerId,
  onReplaceWithBot,
  onChangeBotDifficulty,
  onKickPlayer,
  onSwapPosition,
  creatorId,
}: BotManagementPanelProps) {
  // Early return BEFORE any logic to prevent flickering
  if (!isOpen || !gameState) return null;

  const [swapMode, setSwapMode] = useState(false);
  const [selectedPlayerToSwap, setSelectedPlayerToSwap] = useState<string | null>(null);

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const botCount = gameState.players.filter(p => p.isBot).length;
  const canAddMoreBots = botCount < 3;
  const isCreator = creatorId && currentPlayerId === creatorId;

  // Can only replace humans with bots, not yourself (creator only)
  const canReplace = (player: typeof gameState.players[0]) => {
    return currentPlayer &&
           !player.isBot &&
           !player.isEmpty &&
           player.id !== currentPlayerId &&
           isCreator &&
           canAddMoreBots;
  };

  // Can kick any non-empty player except yourself (creator only)
  const canKick = (player: typeof gameState.players[0]) => {
    return isCreator &&
           !player.isEmpty &&
           player.id !== currentPlayerId &&
           onKickPlayer;
  };

  // Handle swap initiation
  const handleSwapClick = (playerId: string) => {
    if (swapMode && selectedPlayerToSwap === playerId) {
      // Cancel swap if clicking the same player
      setSwapMode(false);
      setSelectedPlayerToSwap(null);
    } else if (swapMode && selectedPlayerToSwap && selectedPlayerToSwap !== playerId) {
      // Complete the swap
      if (onSwapPosition) {
        onSwapPosition(playerId);
      }
      setSwapMode(false);
      setSelectedPlayerToSwap(null);
    } else {
      // Start swap mode
      setSwapMode(true);
      setSelectedPlayerToSwap(playerId);
    }
  };

  // Can swap with other players based on game phase
  const canSwap = (player: typeof gameState.players[0]) => {
    if (!onSwapPosition || player.isEmpty || player.id === currentPlayerId) {
      return false;
    }

    // During team_selection: can swap with any teammate
    if (gameState.phase === 'team_selection') {
      const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
      return currentPlayer && currentPlayer.teamId === player.teamId;
    }

    // During active gameplay: can only swap with bots (any team)
    if (gameState.phase !== 'game_over') {
      return player.isBot === true;
    }

    return false;
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-blue-600 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Match PlayerStatsModal pattern */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-900 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-blue-950 dark:border-gray-900 z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚙️</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Team Management</h2>
              <p className="text-blue-200 dark:text-gray-300 font-semibold">
                {isCreator ? 'Manage teams, positions & bots' : 'View teams & bots'} • Bots: {botCount}/3
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSwapMode(false);
              setSelectedPlayerToSwap(null);
              onClose();
            }}
            className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
          >
            ✕
          </button>
        </div>

        {/* Content - Match PlayerStatsModal pattern */}
        <div className="p-6 space-y-3">
          {gameState.players.map((player, index) => {
            const isMe = player.id === currentPlayerId;
            const isEmptySeat = player.isEmpty;
            const bgColor = isEmptySeat
              ? 'bg-gray-100 dark:bg-gray-800'
              : player.teamId === 1
                ? 'bg-orange-50 dark:bg-orange-900/20'
                : 'bg-purple-50 dark:bg-purple-900/20';
            const borderColor = isEmptySeat
              ? 'border-gray-400 dark:border-gray-600 border-dashed'
              : player.teamId === 1
                ? 'border-orange-300 dark:border-orange-600'
                : 'border-purple-300 dark:border-purple-600';
            const textColor = isEmptySeat
              ? 'text-gray-500 dark:text-gray-500'
              : player.teamId === 1
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-purple-700 dark:text-purple-300';
            const isPlayerTurn = gameState.currentPlayerIndex === index;

            return (
              <div
                key={`${player.name}-${index}`}
                className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 transition-all ${
                  isMe ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${textColor} ${isEmptySeat ? 'italic' : ''}`}>
                        {isEmptySeat ? '💺 ' : ''}{isEmptySeat ? (player.emptySlotName || 'Empty Seat') : player.name}
                      </span>
                      {isMe && !isEmptySeat && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                      {isPlayerTurn && !isEmptySeat && (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                          TURN
                        </span>
                      )}
                      {!isEmptySeat && (
                        <span className={`${textColor} text-sm font-semibold ml-2`}>
                          Team {player.teamId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bot Indicator & Difficulty / Empty Seat Indicator */}
                  {isEmptySeat ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400 italic">Empty</span>
                      </div>
                    </div>
                  ) : player.isBot ? (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">🤖 Bot</span>
                      </div>

                      {/* Difficulty Selector - Dark mode support */}
                      <select
                        value={player.botDifficulty || 'hard'}
                        onChange={(e) => {
                          e.stopPropagation(); // Prevent modal closing on select
                          onChangeBotDifficulty(player.name, e.target.value as BotDifficulty);
                        }}
                        className="bg-white dark:bg-gray-700 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Change bot difficulty"
                      >
                        <option value="easy">😊 Easy</option>
                        <option value="medium">🙂 Medium</option>
                        <option value="hard">😎 Hard</option>
                      </select>

                      {/* Swap Button for Bots */}
                      {canSwap(player) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapClick(player.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            swapMode && selectedPlayerToSwap === player.id
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white ring-2 ring-yellow-400'
                              : swapMode
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          title={swapMode && selectedPlayerToSwap === player.id ? 'Cancel swap' : swapMode ? 'Swap with this bot' : 'Swap positions'}
                        >
                          {swapMode && selectedPlayerToSwap === player.id ? 'Cancel' : swapMode ? '↔️ Swap' : '↔️'}
                        </button>
                      )}

                      {/* Kick Bot Button */}
                      {canKick(player) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove bot ${player.name}?`)) {
                              onKickPlayer!(player.id);
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                          title="Remove bot from game"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">👤 Human</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Swap Button */}
                        {canSwap(player) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwapClick(player.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                              swapMode && selectedPlayerToSwap === player.id
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white ring-2 ring-yellow-400'
                                : swapMode
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            title={swapMode && selectedPlayerToSwap === player.id ? 'Cancel swap' : swapMode ? 'Swap with this player' : 'Swap positions'}
                          >
                            {swapMode && selectedPlayerToSwap === player.id ? 'Cancel' : swapMode ? '↔️ Swap' : '↔️'}
                          </button>
                        )}

                        {/* Replace with Bot Button */}
                        {canReplace(player) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReplaceWithBot(player.name);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                            title="Replace with bot"
                          >
                            🤖 Bot
                          </button>
                        )}

                        {/* Kick Button */}
                        {canKick(player) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove ${player.name} from the game?`)) {
                                onKickPlayer!(player.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                            title="Remove player from game"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Swap Mode Indicator */}
                {swapMode && selectedPlayerToSwap === player.id && (
                  <div className="mt-2 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-2 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 font-semibold animate-pulse">
                    👆 Click another player to swap positions
                  </div>
                )}
              </div>
            );
          })}

          {/* Swap Mode Global Indicator */}
          {swapMode && (
            <div className="mt-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-4 text-center">
              <p className="text-blue-900 dark:text-blue-200 font-bold text-lg mb-2">
                🔄 Swap Mode Active
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {selectedPlayerToSwap
                  ? 'Click another player to complete the swap, or click the yellow "Cancel" button'
                  : 'Select a player to swap with'}
              </p>
            </div>
          )}

          {/* Help Text for Non-Creators */}
          {!isCreator && (
            <div className="mt-4 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                ℹ️ Only the game creator can manage teams and swap positions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

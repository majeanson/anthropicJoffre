import { memo } from 'react';
import { GameState, BotDifficulty } from '../types/game';
import { Modal, Button, UICard, Select } from './ui';
import type { SelectOption } from './ui/Select';

// Bot difficulty options
const DIFFICULTY_OPTIONS: SelectOption[] = [
  { value: 'easy', label: '😊 Easy' },
  { value: 'medium', label: '🙂 Medium' },
  { value: 'hard', label: '😎 Hard' },
];

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

  const currentPlayer = gameState.players.find(p => p.name === currentPlayerId || p.id === currentPlayerId);
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

  // Handle swap - single click swaps you with target player
  const handleSwapClick = (targetPlayerId: string) => {
    if (onSwapPosition) {
      onSwapPosition(targetPlayerId);
    }
  };

  // Can swap with other players based on game phase
  const canSwap = (player: typeof gameState.players[0]) => {
    if (!onSwapPosition || player.isEmpty || player.id === currentPlayerId) {
      return false;
    }

    // Allow swapping with any other player (bots and humans) during active game
    // Position-based team assignment (1-2-1-2 pattern) enforced after swap
    // Human-to-human swaps require confirmation (handled by App.tsx)
    // Bot swaps are immediate
    return gameState.phase !== 'game_over';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Management"
      subtitle={`${isCreator ? 'Manage teams, positions & bots' : 'View teams & bots'} • Bots: ${botCount}/3`}
      icon="⚙️"
      theme="blue"
      size="md"
    >
      <div className="space-y-3">
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
              <UICard
                key={`${player.name}-${index}`}
                variant="bordered"
                size="md"
                className={`${bgColor} border-2 ${borderColor} transition-all ${
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
                      <Select
                        id={`difficulty-${player.name}`}
                        value={player.botDifficulty || 'hard'}
                        onChange={(e) => {
                          e.stopPropagation(); // Prevent modal closing on select
                          onChangeBotDifficulty(player.name, e.target.value as BotDifficulty);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        options={DIFFICULTY_OPTIONS}
                        variant="default"
                        size="sm"
                        title="Change bot difficulty"
                      />

                      {/* Swap Button for Bots */}
                      {canSwap(player) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapClick(player.id);
                          }}
                          title="Swap positions with this bot"
                        >
                          ↔️
                        </Button>
                      )}

                      {/* Kick Bot Button */}
                      {canKick(player) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove bot ${player.name}?`)) {
                              onKickPlayer!(player.id);
                            }
                          }}
                          title="Remove bot from game"
                        >
                          ✕
                        </Button>
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
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwapClick(player.id);
                            }}
                            title="Swap positions with this player (requires confirmation)"
                          >
                            ↔️
                          </Button>
                        )}

                        {/* Replace with Bot Button */}
                        {canReplace(player) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReplaceWithBot(player.name);
                            }}
                            title="Replace with bot"
                          >
                            🤖 Bot
                          </Button>
                        )}

                        {/* Kick Button */}
                        {canKick(player) && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove ${player.name} from the game?`)) {
                                onKickPlayer!(player.id);
                              }
                            }}
                            title="Remove player from game"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </UICard>
            );
          })}

        {/* Help Text for Non-Creators */}
        {!isCreator && (
          <UICard variant="bordered" size="md" className="mt-4 bg-gray-100 dark:bg-gray-700 text-center">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              ℹ️ Only the game creator can manage teams and swap positions
            </p>
          </UICard>
        )}
      </div>
    </Modal>
  );
});

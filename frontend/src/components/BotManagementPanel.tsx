import { GameState, BotDifficulty } from '../types/game';

interface BotManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState | null;
  currentPlayerId: string;
  onReplaceWithBot: (playerName: string) => void;
  onChangeBotDifficulty: (botName: string, difficulty: BotDifficulty) => void;
}

export function BotManagementPanel({
  isOpen,
  onClose,
  gameState,
  currentPlayerId,
  onReplaceWithBot,
  onChangeBotDifficulty,
}: BotManagementPanelProps) {
  // Early return BEFORE any logic to prevent flickering
  if (!isOpen || !gameState) return null;

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const botCount = gameState.players.filter(p => p.isBot).length;
  const canAddMoreBots = botCount < 3;

  // Check if player is teammate (same team) for replace button
  const isTeammate = (player: typeof gameState.players[0]) => {
    if (!currentPlayer) return false;
    return player.teamId === currentPlayer.teamId;
  };

  // Can only replace humans with bots, not yourself, and only teammates
  const canReplace = (player: typeof gameState.players[0]) => {
    return currentPlayer &&
           !player.isBot &&
           player.id !== currentPlayerId &&
           isTeammate(player) &&
           canAddMoreBots;
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-blue-600 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Match PlayerStatsModal pattern */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-900 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-blue-950 dark:border-gray-900 z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🤖</span>
            <div>
              <h2 className="text-2xl font-bold text-white">Bot Management</h2>
              <p className="text-blue-200 dark:text-gray-300 font-semibold">
                Bots: {botCount}/3 • {canAddMoreBots ? 'Can add more' : 'Max reached'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-200 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold text-gray-700">🤖 Bot</span>
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
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold text-green-700">👤 Human</span>
                      </div>

                      {/* Replace Button */}
                      {canReplace(player) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent modal closing on click
                            onReplaceWithBot(player.name);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
                          title="Replace with bot"
                        >
                          Replace
                        </button>
                      ) : (
                        <div className="w-[88px]" /> // Placeholder for alignment
                      )}
                    </div>
                  )}
                </div>

                {/* Replacement Restrictions Tooltip */}
                {!player.isBot && !isEmptySeat && !canReplace(player) && player.id !== currentPlayerId && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                    {!isTeammate(player) && "⛔ Not your teammate"}
                    {isTeammate(player) && !canAddMoreBots && "⛔ Max 3 bots reached"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

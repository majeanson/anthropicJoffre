import { GameState, BotDifficulty } from '../types/game';

interface BotManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
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
  if (!isOpen) return null;

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  if (!currentPlayer) return null;

  const botCount = gameState.players.filter(p => p.isBot).length;
  const canAddMoreBots = botCount < 3;

  // Check if player is teammate (same team) for replace button
  const isTeammate = (player: typeof gameState.players[0]) => {
    return player.teamId === currentPlayer.teamId;
  };

  // Can only replace humans with bots, not yourself, and only teammates
  const canReplace = (player: typeof gameState.players[0]) => {
    return !player.isBot &&
           player.id !== currentPlayerId &&
           isTeammate(player) &&
           canAddMoreBots;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 max-w-2xl w-full mx-4 border-4 border-blue-600 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-blue-900">
              🤖 Bot Management
            </h2>
            <p className="text-blue-700 font-semibold mt-1">
              Bots: {botCount}/3 • {canAddMoreBots ? 'Can add more' : 'Max reached'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-900 hover:bg-blue-200 rounded-full p-2 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Players List */}
        <div className="space-y-3">
          {gameState.players.map((player, index) => {
            const isMe = player.id === currentPlayerId;
            const bgColor = player.teamId === 1 ? 'bg-orange-50' : 'bg-purple-50';
            const borderColor = player.teamId === 1 ? 'border-orange-300' : 'border-purple-300';
            const textColor = player.teamId === 1 ? 'text-orange-700' : 'text-purple-700';
            const isPlayerTurn = gameState.currentPlayerIndex === index;

            return (
              <div
                key={player.id}
                className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 transition-all ${
                  isMe ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${textColor}`}>
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                      {isPlayerTurn && (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                          TURN
                        </span>
                      )}
                      <span className={`${textColor} text-sm font-semibold ml-2`}>
                        Team {player.teamId}
                      </span>
                    </div>
                  </div>

                  {/* Bot Indicator & Difficulty */}
                  {player.isBot ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-200 px-3 py-1.5 rounded-full">
                        <span className="text-sm font-bold text-gray-700">🤖 Bot</span>
                      </div>

                      {/* Difficulty Selector */}
                      <select
                        value={player.botDifficulty || 'hard'}
                        onChange={(e) => onChangeBotDifficulty(player.name, e.target.value as BotDifficulty)}
                        className="bg-white border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          onClick={() => onReplaceWithBot(player.name)}
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
                {!player.isBot && !canReplace(player) && player.id !== currentPlayerId && (
                  <div className="mt-2 text-xs text-gray-600 italic">
                    {!isTeammate(player) && "⛔ Not your teammate"}
                    {isTeammate(player) && !canAddMoreBots && "⛔ Max 3 bots reached"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-black text-lg shadow-lg transition-all transform hover:scale-105"
        >
          Close
        </button>
      </div>
    </div>
  );
}

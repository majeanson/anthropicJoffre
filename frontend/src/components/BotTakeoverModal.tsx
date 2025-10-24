import { BotDifficulty } from '../types/game';

interface BotTakeoverModalProps {
  isOpen: boolean;
  availableBots: Array<{
    name: string;
    teamId: 1 | 2;
    difficulty: BotDifficulty;
  }>;
  onTakeOver: (botName: string) => void;
  onCancel: () => void;
}

export function BotTakeoverModal({
  isOpen,
  availableBots,
  onTakeOver,
  onCancel,
}: BotTakeoverModalProps) {
  if (!isOpen) return null;

  const getDifficultyEmoji = (difficulty: BotDifficulty): string => {
    switch (difficulty) {
      case 'easy':
        return '😊';
      case 'medium':
        return '🙂';
      case 'hard':
        return '😎';
      default:
        return '🤖';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border-4 border-blue-600 dark:border-blue-500 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black text-blue-900 dark:text-blue-100 mb-2">
            🎮 Game is Full!
          </h2>
          <p className="text-blue-700 dark:text-blue-300 font-semibold">
            This game has bot players. You can take over a bot to join!
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> You'll inherit the bot's team, position, hand, and score.
          </p>
        </div>

        {/* Bots List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            Available Bots:
          </h3>
          {availableBots.map((bot) => (
            <div
              key={bot.name}
              className={`rounded-lg p-4 border-2 ${
                bot.teamId === 1
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600'
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                {/* Bot Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      bot.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'
                    }`}></span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {bot.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Team {bot.teamId} • {getDifficultyEmoji(bot.difficulty)} {bot.difficulty.charAt(0).toUpperCase() + bot.difficulty.slice(1)}
                  </div>
                </div>
              </div>

              {/* Take Over Button */}
              <button
                onClick={() => onTakeOver(bot.name)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Take Over {bot.name}
              </button>
            </div>
          ))}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-black py-3 px-6 rounded-xl transition-all duration-200 shadow-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

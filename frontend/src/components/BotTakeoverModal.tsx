import { BotDifficulty } from '../types/game';
import { colors } from '../design-system';

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
        return '😤';
      case 'hard':
        return '👹';
      default:
        return '🤖';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onKeyDown={(e) => e.stopPropagation()}>
      <div
        style={{
          background: `linear-gradient(to bottom right, ${colors.info.start}, ${colors.primary.end})`,
          borderColor: colors.info.border
        }}
        className="rounded-2xl p-6 max-w-md w-full mx-4 border-4 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black text-white mb-2">
            <span aria-hidden="true">🎮</span> Game is Full!
          </h2>
          <p className="text-white/90 font-semibold">
            This game has bot players. You can take over a bot to join!
          </p>
        </div>

        {/* Info Box */}
        <div
          style={{
            backgroundColor: `${colors.info.start}30`,
            borderColor: colors.info.border
          }}
          className="border-2 rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-white">
            <strong>Note:</strong> You'll inherit the bot's team, position, hand, and score.
          </p>
        </div>

        {/* Bots List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-bold text-white mb-2">
            Available Bots:
          </h3>
          {availableBots.map((bot) => (
            <div
              key={bot.name}
              style={bot.teamId === 1 ? {
                backgroundColor: `${colors.team1.start}20`,
                borderColor: colors.team1.border
              } : {
                backgroundColor: `${colors.team2.start}20`,
                borderColor: colors.team2.border
              }}
              className="rounded-lg p-4 border-2"
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
                style={{
                  background: `linear-gradient(to right, ${colors.success.start}, ${colors.success.end})`
                }}
                className="w-full text-white font-black py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:outline-none"
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

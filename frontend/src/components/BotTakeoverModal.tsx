import { BotDifficulty } from '../types/game';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

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
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Game is Full!"
      subtitle="You can take over a bot to join"
      icon="🎮"
      theme="blue"
      size="md"
      footer={
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Cancel
        </Button>
      }
    >
      {/* Info Box */}
      <div className="bg-blue-100/50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          <strong>Note:</strong> You'll inherit the bot's team, position, hand, and score.
        </p>
      </div>

      {/* Bots List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Available Bots:
        </h3>
        {availableBots.map((bot) => (
          <div
            key={bot.name}
            className={`rounded-lg p-4 border-2 ${
              bot.teamId === 1
                ? 'bg-orange-100/30 dark:bg-orange-900/20 border-orange-600 dark:border-orange-700'
                : 'bg-purple-100/30 dark:bg-purple-900/20 border-purple-600 dark:border-purple-700'
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
            <Button
              variant="success"
              onClick={() => onTakeOver(bot.name)}
              fullWidth
            >
              Take Over {bot.name}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

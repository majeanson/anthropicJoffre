import { BotDifficulty } from '../types/game';
import { Modal, Button, Alert, TeamCard, TeamIndicator } from './ui';

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
      <Alert variant="info" className="mb-6">
        <strong>Note:</strong> You'll inherit the bot's team, position, hand, and score.
      </Alert>

      {/* Bots List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Available Bots:</h3>
        {availableBots.map((bot) => (
          <TeamCard key={bot.name} teamId={bot.teamId} variant="subtle" size="lg">
            <div className="flex items-center justify-between gap-4 mb-3">
              {/* Bot Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <TeamIndicator teamId={bot.teamId} size="md" />
                  <span className="font-bold text-gray-900">{bot.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Team {bot.teamId} • {getDifficultyEmoji(bot.difficulty)}{' '}
                  {bot.difficulty.charAt(0).toUpperCase() + bot.difficulty.slice(1)}
                </div>
              </div>
            </div>

            {/* Take Over Button */}
            <Button variant="success" onClick={() => onTakeOver(bot.name)} fullWidth>
              Take Over {bot.name}
            </Button>
          </TeamCard>
        ))}
      </div>
    </Modal>
  );
}

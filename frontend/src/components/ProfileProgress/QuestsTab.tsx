/**
 * QuestsTab Component
 *
 * Shows daily quests with progress and claim functionality.
 * Part of ProfileProgressModal.
 */

import { Button, ProgressBar, UIBadge, UICard } from '../ui';

interface QuestTemplate {
  id: number;
  quest_key: string;
  name: string;
  description: string;
  quest_type: 'easy' | 'medium' | 'hard';
  objective_type: string;
  target_value: number;
  reward_xp: number;
  reward_currency: number;
  icon: string;
  is_active: boolean;
}

interface PlayerQuest {
  id: number;
  player_name: string;
  quest_template_id: number;
  progress: number;
  completed: boolean;
  date_assigned: string;
  completed_at?: string;
  reward_claimed: boolean;
  claimed_at?: string;
  template?: QuestTemplate;
}

interface QuestsTabProps {
  quests: PlayerQuest[];
  questNotification: string | null;
  claimingQuestId: number | null;
  onClaimReward: (questId: number) => void;
}

export function QuestsTab({
  quests,
  questNotification,
  claimingQuestId,
  onClaimReward,
}: QuestsTabProps) {
  const getDifficultyLabel = (type: 'easy' | 'medium' | 'hard') =>
    type.charAt(0).toUpperCase() + type.slice(1);

  const completedCount = quests.filter((q) => q.completed).length;
  const progressPercent = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Notification */}
      {questNotification && (
        <UICard
          variant="gradient"
          gradient="success"
          size="sm"
          className="text-center animate-pulse"
        >
          <p className="text-skin-success">{questNotification}</p>
        </UICard>
      )}

      {/* Quest summary */}
      <div className="p-4 rounded-lg bg-skin-secondary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-skin-primary">Today's Progress</h3>
          <span className="text-sm font-bold text-skin-accent">
            {completedCount}/{quests.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden bg-skin-tertiary">
          <div
            className="h-full rounded-full transition-all duration-300 bg-skin-accent"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quest List */}
      {quests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl mb-2">📋</p>
          <p className="text-skin-muted">No quests available</p>
          <p className="text-xs text-skin-muted">Check back tomorrow for new quests!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => {
            if (!quest.template) return null;

            return (
              <UICard
                key={quest.id}
                variant="bordered"
                size="md"
                className="hover:border-skin-default transition-colors"
              >
                {/* Quest Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{quest.template.icon}</span>
                    <div>
                      <h3 className="font-semibold text-skin-primary">
                        {quest.template.name}
                      </h3>
                      <p className="text-sm text-skin-muted">
                        {quest.template.description}
                      </p>
                    </div>
                  </div>
                  <UIBadge
                    variant="subtle"
                    color={
                      quest.template.quest_type === 'easy'
                        ? 'success'
                        : quest.template.quest_type === 'medium'
                          ? 'warning'
                          : 'error'
                    }
                    size="sm"
                  >
                    {getDifficultyLabel(quest.template.quest_type)}
                  </UIBadge>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <ProgressBar
                    value={quest.progress}
                    max={quest.template.target_value}
                    label={`${quest.progress}/${quest.template.target_value}`}
                    showValue
                    variant="gradient"
                    color={quest.completed ? 'success' : 'primary'}
                    size="md"
                  />
                </div>

                {/* Rewards and Action */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-skin-info">⭐</span>
                      <span className="text-skin-secondary">
                        {quest.template.reward_xp} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-skin-warning">💰</span>
                      <span className="text-skin-secondary">
                        {quest.template.reward_currency} coins
                      </span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {quest.completed && !quest.reward_claimed ? (
                    <Button
                      onClick={() => onClaimReward(quest.id)}
                      disabled={claimingQuestId === quest.id}
                      variant="success"
                      size="sm"
                    >
                      {claimingQuestId === quest.id ? 'Claiming...' : 'Claim'}
                    </Button>
                  ) : quest.reward_claimed ? (
                    <span className="font-semibold text-sm text-skin-success">
                      ✓ Claimed
                    </span>
                  ) : (
                    <span className="text-sm text-skin-muted">In Progress</span>
                  )}
                </div>
              </UICard>
            );
          })}
        </div>
      )}

      <p className="text-xs text-center text-skin-muted">
        New quests available daily at midnight UTC
      </p>
    </div>
  );
}

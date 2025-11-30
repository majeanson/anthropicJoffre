/**
 * Daily Quests Panel Component
 * Sprint 19: Daily Engagement System
 *
 * Displays player's daily quests with progress tracking and rewards
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { UICard, UIBadge, Button, LoadingState, EmptyState, Modal, ProgressBar } from './ui';

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

interface QuestProgressUpdate {
  questId: number;
  progressDelta: number;
  newProgress: number;
  completed: boolean;
  questName: string;
}

interface DailyQuestsPanelProps {
  socket: Socket | null;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DailyQuestsPanel({
  socket,
  playerName,
  isOpen,
  onClose,
}: DailyQuestsPanelProps) {
  const [quests, setQuests] = useState<PlayerQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch daily quests on mount and when player changes
  useEffect(() => {
    if (!socket || !playerName) return;

    const fetchQuests = () => {
      setLoading(true);
      socket.emit('get_daily_quests', { playerName });
    };

    fetchQuests();

    // Listen for quest data
    const handleDailyQuests = (data: { quests: PlayerQuest[] }) => {
      setQuests(data.quests);
      setLoading(false);
    };

    // Listen for quest progress updates
    const handleQuestProgressUpdate = (data: { updates: QuestProgressUpdate[] }) => {
      // Update quest progress in real-time
      setQuests((prevQuests) =>
        prevQuests.map((quest) => {
          const update = data.updates.find((u) => u.questId === quest.id);
          if (update) {
            // Show notification
            if (update.completed) {
              setNotification(`🎉 Quest completed: ${update.questName}!`);
              setTimeout(() => setNotification(null), 5000);
            }

            return {
              ...quest,
              progress: update.newProgress,
              completed: update.completed,
              completed_at: update.completed ? new Date().toISOString() : quest.completed_at,
            };
          }
          return quest;
        })
      );
    };

    // Listen for reward claimed
    const handleQuestRewardClaimed = (data: {
      questId: number;
      rewards: { xp: number; currency: number };
    }) => {
      setQuests((prevQuests) =>
        prevQuests.map((quest) =>
          quest.id === data.questId
            ? { ...quest, reward_claimed: true, claimed_at: new Date().toISOString() }
            : quest
        )
      );

      setNotification(
        `✅ Claimed: +${data.rewards.xp} XP, +${data.rewards.currency} coins!`
      );
      setTimeout(() => setNotification(null), 5000);
      setClaimingQuestId(null);
    };

    socket.on('daily_quests', handleDailyQuests);
    socket.on('quest_progress_update', handleQuestProgressUpdate);
    socket.on('quest_reward_claimed', handleQuestRewardClaimed);

    return () => {
      socket.off('daily_quests', handleDailyQuests);
      socket.off('quest_progress_update', handleQuestProgressUpdate);
      socket.off('quest_reward_claimed', handleQuestRewardClaimed);
    };
  }, [socket, playerName]);

  const handleClaimReward = (questId: number) => {
    if (!socket || claimingQuestId) return;

    setClaimingQuestId(questId);
    socket.emit('claim_quest_reward', { playerName, questId });
  };

  const getDifficultyLabel = (type: 'easy' | 'medium' | 'hard') => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Quests"
      icon="📋"
      subtitle="Complete quests to earn XP and coins"
      theme="purple"
      size="lg"
      testId="daily-quests"
    >
      {/* Notification */}
      {notification && (
        <div className="mb-4">
          <UICard variant="gradient" gradient="success" size="sm" className="text-center animate-pulse">
            <p className="text-green-900 dark:text-white">{notification}</p>
          </UICard>
        </div>
      )}

      {/* Content */}
      <div>
          {loading ? (
            <LoadingState message="Loading quests..." size="lg" />
          ) : quests.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No quests available"
              description="Check back tomorrow for new quests!"
            />
          ) : (
            <div className="space-y-4">
              {quests.map((quest) => {
                if (!quest.template) return null;

                return (
                  <UICard
                    key={quest.id}
                    variant="bordered"
                    size="md"
                    className="hover:border-gray-500 transition-colors"
                  >
                    {/* Quest Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{quest.template.icon}</span>
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                            {quest.template.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {quest.template.description}
                          </p>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
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
                        label={`Progress: ${quest.progress}/${quest.template.target_value}`}
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
                          <span className="text-blue-500 dark:text-blue-400">⭐</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {quest.template.reward_xp} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 dark:text-yellow-400">💰</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {quest.template.reward_currency} coins
                          </span>
                        </div>
                      </div>

                      {/* Claim Button */}
                      {quest.completed && !quest.reward_claimed ? (
                        <Button
                          onClick={() => handleClaimReward(quest.id)}
                          disabled={claimingQuestId === quest.id}
                          variant="success"
                        >
                          {claimingQuestId === quest.id ? 'Claiming...' : 'Claim Reward'}
                        </Button>
                      ) : quest.reward_claimed ? (
                        <span className="text-green-400 font-semibold">✓ Claimed</span>
                      ) : (
                        <span className="text-gray-500 text-sm">In Progress</span>
                      )}
                    </div>
                  </UICard>
                );
              })}
            </div>
          )}
      </div>

      {/* Footer note */}
      <div className="mt-4 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          🔄 New quests available every day at midnight
        </p>
      </div>
    </Modal>
  );
}

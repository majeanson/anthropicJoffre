/**
 * Daily Quests Panel Component
 * Sprint 19: Daily Engagement System
 *
 * Displays player's daily quests with progress tracking and rewards
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { colors } from '../design-system';

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

  const getProgressPercentage = (progress: number, target: number) => {
    return Math.min(100, Math.floor((progress / target) * 100));
  };

  const getDifficultyColor = (type: 'easy' | 'medium' | 'hard') => {
    switch (type) {
      case 'easy':
        return 'text-green-400 bg-green-900/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'hard':
        return 'text-red-400 bg-red-900/30';
    }
  };

  const getDifficultyLabel = (type: 'easy' | 'medium' | 'hard') => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.gradients.primaryDark} p-6 rounded-t-lg`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Daily Quests</h2>
              <p className="text-purple-100 mt-1">
                Complete quests to earn XP and coins
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mx-6 mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-100 text-center animate-pulse">
            {notification}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-4">Loading quests...</p>
            </div>
          ) : quests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No quests available</p>
              <p className="text-gray-500 text-sm mt-2">
                Check back tomorrow for new quests!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quests.map((quest) => {
                if (!quest.template) return null;

                const progressPercent = getProgressPercentage(
                  quest.progress,
                  quest.template.target_value
                );

                return (
                  <div
                    key={quest.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    {/* Quest Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{quest.template.icon}</span>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {quest.template.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {quest.template.description}
                          </p>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                          quest.template.quest_type
                        )}`}
                      >
                        {getDifficultyLabel(quest.template.quest_type)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">
                          Progress: {quest.progress}/{quest.template.target_value}
                        </span>
                        <span className="text-gray-300">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            quest.completed
                              ? 'bg-gradient-to-r from-green-500 to-green-400'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Rewards and Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400">⭐</span>
                          <span className="text-gray-300">
                            {quest.template.reward_xp} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">💰</span>
                          <span className="text-gray-300">
                            {quest.template.reward_currency} coins
                          </span>
                        </div>
                      </div>

                      {/* Claim Button */}
                      {quest.completed && !quest.reward_claimed ? (
                        <button
                          onClick={() => handleClaimReward(quest.id)}
                          disabled={claimingQuestId === quest.id}
                          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claimingQuestId === quest.id ? 'Claiming...' : 'Claim Reward'}
                        </button>
                      ) : quest.reward_claimed ? (
                        <span className="text-green-400 font-semibold">✓ Claimed</span>
                      ) : (
                        <span className="text-gray-500 text-sm">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-700 p-4 rounded-b-lg border-t border-gray-600">
          <p className="text-gray-400 text-sm text-center">
            🔄 New quests available every day at midnight
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Personal Hub Component
 * Sprint 19: Unified access to player's personal features
 *
 * Provides quick access to:
 * - Daily Quests
 * - 30-Day Rewards Calendar
 * - Achievements
 * - Player Profile
 * - Login Streak
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Modal, UICard, Button, Spinner } from './ui';
import { LoginStreakBadge } from './LoginStreakBadge';
import {
  getLevelProgress,
  getLevelTitle,
  getLevelColor,
  getLevelGradient,
  formatXp,
} from '../utils/xpSystem';

interface QuestSummary {
  total: number;
  completed: number;
  claimable: number;
}

interface CalendarSummary {
  currentDay: number;
  canClaimToday: boolean;
  totalClaimed: number;
}

interface PlayerStatsSummary {
  total_xp: number;
  current_level: number;
  games_played: number;
  games_won: number;
  win_percentage: number;
  elo_rating: number;
}

interface PersonalHubProps {
  socket: Socket | null;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuests: () => void;
  onOpenCalendar: () => void;
  onOpenAchievements: () => void;
  onOpenProfile: () => void;
}

export function PersonalHub({
  socket,
  playerName,
  isOpen,
  onClose,
  onOpenQuests,
  onOpenCalendar,
  onOpenAchievements,
  onOpenProfile,
}: PersonalHubProps) {
  const [questSummary, setQuestSummary] = useState<QuestSummary | null>(null);
  const [calendarSummary, setCalendarSummary] = useState<CalendarSummary | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !playerName || !isOpen) return;

    setLoading(true);

    // Fetch quest summary, calendar progress, and player stats
    socket.emit('get_daily_quests', { playerName });
    socket.emit('get_player_calendar_progress', { playerName });
    socket.emit('get_player_stats', { playerName });

    const handleDailyQuests = (data: {
      quests: Array<{ completed: boolean; reward_claimed: boolean }>;
    }) => {
      const total = data.quests.length;
      const completed = data.quests.filter((q) => q.completed).length;
      const claimable = data.quests.filter((q) => q.completed && !q.reward_claimed).length;
      setQuestSummary({ total, completed, claimable });
      setLoading(false);
    };

    const handleCalendarProgress = (data: { currentDay: number; rewardsClaimed: number[] }) => {
      const canClaimToday = !data.rewardsClaimed.includes(data.currentDay);
      setCalendarSummary({
        currentDay: data.currentDay,
        canClaimToday,
        totalClaimed: data.rewardsClaimed.length,
      });
    };

    const handlePlayerStats = (data: { stats: PlayerStatsSummary | null; playerName: string }) => {
      if (data.playerName === playerName && data.stats) {
        setPlayerStats({
          total_xp: data.stats.total_xp || 0,
          current_level: data.stats.current_level || 1,
          games_played: data.stats.games_played || 0,
          games_won: data.stats.games_won || 0,
          win_percentage: data.stats.win_percentage || 0,
          elo_rating: data.stats.elo_rating || 1200,
        });
      }
    };

    socket.on('daily_quests', handleDailyQuests);
    socket.on('calendar_progress', handleCalendarProgress);
    socket.on('player_stats_response', handlePlayerStats);

    return () => {
      socket.off('daily_quests', handleDailyQuests);
      socket.off('calendar_progress', handleCalendarProgress);
      socket.off('player_stats_response', handlePlayerStats);
    };
  }, [socket, playerName, isOpen]);

  const handleOpenSection = (openFn: () => void) => {
    onClose();
    openFn();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Progress"
      subtitle={`Welcome back, ${playerName}!`}
      icon="🎮"
      theme="purple"
      size="lg"
      testId="personal-hub-modal"
    >
      {loading ? (
        <div className="text-center py-8">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600 mt-4">Loading your progress...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* XP and Level Display */}
          {playerStats &&
            (() => {
              const progress = getLevelProgress(playerStats.total_xp);
              const levelTitle = getLevelTitle(progress.level);
              const levelColor = getLevelColor(progress.level);
              const levelGradient = getLevelGradient(progress.level);

              return (
                <UICard variant="bordered" size="md">
                  <div className="flex items-center gap-4">
                    {/* Level Badge */}
                    <div
                      className={`
                      w-16 h-16 rounded-xl flex flex-col items-center justify-center
                      bg-gradient-to-br ${levelGradient}
                      shadow-lg
                    `}
                    >
                      <span className="text-white font-bold text-2xl">{progress.level}</span>
                      <span className="text-white/80 text-[10px] uppercase">Level</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-lg ${levelColor}`}>{levelTitle}</span>
                        <span className="text-xs text-gray-500">
                          {formatXp(playerStats.total_xp)} XP Total
                        </span>
                      </div>
                      {/* XP Progress Bar */}
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${levelGradient} transition-all duration-500`}
                          style={{ width: `${progress.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {progress.progressPercent}% to Level {progress.level + 1}
                        </span>
                        <span>{formatXp(progress.xpToNextLevel)} XP needed</span>
                      </div>
                    </div>
                  </div>
                  {/* Quick Stats Row */}
                  <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-500">
                        {playerStats.games_played}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">
                        Games
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-500">
                        {playerStats.win_percentage.toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">
                        Win Rate
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-500">
                        {playerStats.elo_rating}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">
                        ELO
                      </div>
                    </div>
                  </div>
                </UICard>
              );
            })()}

          {/* Login Streak */}
          <UICard
            variant="gradient"
            gradient="warning"
            size="md"
            className="cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">Login Streak</h3>
                  <p className="text-gray-700 text-sm">
                    Keep your streak alive!
                  </p>
                </div>
              </div>
              <LoginStreakBadge socket={socket} playerName={playerName} />
            </div>
          </UICard>

          {/* Daily Quests */}
          <UICard
            variant="bordered"
            size="md"
            className="cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => handleOpenSection(onOpenQuests)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">Daily Quests</h3>
                  {questSummary ? (
                    <p className="text-gray-600 text-sm">
                      {questSummary.completed}/{questSummary.total} completed
                      {questSummary.claimable > 0 && (
                        <span className="text-green-600 ml-2">
                          ({questSummary.claimable} reward{questSummary.claimable > 1 ? 's' : ''}{' '}
                          available!)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      Complete quests for XP & coins
                    </p>
                  )}
                </div>
              </div>
              {questSummary && questSummary.claimable > 0 && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {questSummary.claimable} NEW
                </span>
              )}
              <Button variant="ghost" size="sm" className="ml-2">
                View →
              </Button>
            </div>
          </UICard>

          {/* Rewards Calendar */}
          <UICard
            variant="bordered"
            size="md"
            className="cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => handleOpenSection(onOpenCalendar)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📅</span>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">
                    30-Day Rewards
                  </h3>
                  {calendarSummary ? (
                    <p className="text-gray-600 text-sm">
                      Day {calendarSummary.currentDay} of 30
                      {calendarSummary.canClaimToday && (
                        <span className="text-green-600 ml-2">
                          (Today's reward available!)
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      Login daily for rewards
                    </p>
                  )}
                </div>
              </div>
              {calendarSummary?.canClaimToday && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  CLAIM
                </span>
              )}
              <Button variant="ghost" size="sm" className="ml-2">
                View →
              </Button>
            </div>
          </UICard>

          {/* Achievements */}
          <UICard
            variant="bordered"
            size="md"
            className="cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => handleOpenSection(onOpenAchievements)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">Achievements</h3>
                  <p className="text-gray-600 text-sm">
                    Track your accomplishments
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View →
              </Button>
            </div>
          </UICard>

          {/* Profile */}
          <UICard
            variant="bordered"
            size="md"
            className="cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => handleOpenSection(onOpenProfile)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👤</span>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">My Profile</h3>
                  <p className="text-gray-600 text-sm">View stats & customize</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View →
              </Button>
            </div>
          </UICard>

          {/* Call to Action */}
          {questSummary && questSummary.completed < questSummary.total && (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <UICard variant="gradient" gradient="info" size="sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <p className="text-gray-900 text-sm">
                    <strong>Tip:</strong> Play a game to make progress on your daily quests!
                  </p>
                </div>
              </UICard>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

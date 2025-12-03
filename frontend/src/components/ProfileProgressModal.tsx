/**
 * ProfileProgressModal Component
 *
 * Sprint 20: Unified Player Progression
 *
 * Tabbed modal showing all player progression:
 * - Overview: Level, XP, streak, quick stats
 * - Quests: Daily quests with progress
 * - Calendar: 7-day weekly rewards
 * - Skins: Skin collection with lock status
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { LevelProgressBar } from './LevelProgressBar';
import { WeeklyCalendar, WeeklyCalendarDay } from './WeeklyCalendar';
import { useSkin, type SkinId } from '../contexts/SkinContext';
import { skinList } from '../config/skins';

type TabId = 'overview' | 'quests' | 'calendar' | 'skins';

export interface ProfileProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  socket: Socket | null;
}

interface PlayerProgression {
  level: number;
  totalXp: number;
  currentLevelXP: number;
  nextLevelXP: number;
  cosmeticCurrency: number;
  unlockedSkins: string[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalLogins: number;
  };
  questStats: {
    totalQuestsCompleted: number;
    totalQuestsClaimed: number;
    questsCompletedToday: number;
    totalXpEarned: number;
    totalCurrencyEarned: number;
  };
}

interface SkinRequirement {
  skinId: string;
  requiredLevel: number;
  unlockDescription: string;
}

interface WeeklyProgress {
  weekStartDate: string;
  daysClaimed: number[];
  currentDayOfWeek: number;
}

export function ProfileProgressModal({
  isOpen,
  onClose,
  playerName,
  socket,
}: ProfileProgressModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [progression, setProgression] = useState<PlayerProgression | null>(null);
  const [skinRequirements, setSkinRequirements] = useState<SkinRequirement[]>([]);
  const [weeklyCalendar, setWeeklyCalendar] = useState<WeeklyCalendarDay[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  const { skinId, setSkin } = useSkin();

  // Fetch all data on open
  useEffect(() => {
    if (!isOpen || !socket || !playerName) return;

    setIsLoading(true);

    // Request all data
    socket.emit('get_player_progression', { playerName });
    socket.emit('get_skin_requirements');
    socket.emit('get_weekly_calendar');
    socket.emit('get_player_weekly_progress', { playerName });

    // Set up listeners
    const handleProgression = (data: PlayerProgression) => {
      setProgression(data);
      setIsLoading(false);
    };

    const handleSkinRequirements = (data: { requirements: SkinRequirement[] }) => {
      setSkinRequirements(data.requirements);
    };

    const handleWeeklyCalendar = (data: { calendar: WeeklyCalendarDay[] }) => {
      setWeeklyCalendar(data.calendar);
    };

    const handleWeeklyProgress = (data: WeeklyProgress) => {
      setWeeklyProgress(data);
    };

    const handleWeeklyRewardClaimed = (_data: {
      dayNumber: number;
      xp: number;
      currency: number;
      leveledUp: boolean;
      newLevel: number;
    }) => {
      void _data; // Acknowledge receipt, but we just refresh data
      setIsClaimingReward(false);
      // Refresh progression data
      socket.emit('get_player_progression', { playerName });
      socket.emit('get_player_weekly_progress', { playerName });
    };

    socket.on('player_progression', handleProgression);
    socket.on('skin_requirements', handleSkinRequirements);
    socket.on('weekly_calendar', handleWeeklyCalendar);
    socket.on('weekly_progress', handleWeeklyProgress);
    socket.on('weekly_reward_claimed', handleWeeklyRewardClaimed);

    return () => {
      socket.off('player_progression', handleProgression);
      socket.off('skin_requirements', handleSkinRequirements);
      socket.off('weekly_calendar', handleWeeklyCalendar);
      socket.off('weekly_progress', handleWeeklyProgress);
      socket.off('weekly_reward_claimed', handleWeeklyRewardClaimed);
    };
  }, [isOpen, socket, playerName]);

  const handleClaimWeeklyReward = useCallback((dayNumber: number) => {
    if (!socket || !playerName) return;
    setIsClaimingReward(true);
    socket.emit('claim_weekly_reward', { playerName, dayNumber });
  }, [socket, playerName]);

  const isSkinUnlocked = useCallback((skinId: string) => {
    if (!progression) return false;
    // Default skins (level 0) are always unlocked
    const requirement = skinRequirements.find(r => r.skinId === skinId);
    if (!requirement || requirement.requiredLevel === 0) return true;
    return progression.unlockedSkins.includes(skinId);
  }, [progression, skinRequirements]);

  const getRequiredLevel = useCallback((skinId: string) => {
    const requirement = skinRequirements.find(r => r.skinId === skinId);
    return requirement?.requiredLevel || 0;
  }, [skinRequirements]);

  if (!isOpen) return null;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'quests', label: 'Quests', icon: '🎯' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'skins', label: 'Skins', icon: '🎨' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {playerName}'s Progress
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-500/20 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'border-b-2'
                  : 'hover:bg-gray-500/10'
                }
              `}
              style={{
                color: activeTab === tab.id ? 'var(--color-text-accent)' : 'var(--color-text-secondary)',
                borderColor: activeTab === tab.id ? 'var(--color-text-accent)' : 'transparent',
              }}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-2xl">⌛</div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && progression && (
                <div className="space-y-6">
                  {/* Level & XP */}
                  <LevelProgressBar
                    level={progression.level}
                    currentLevelXP={progression.currentLevelXP}
                    nextLevelXP={progression.nextLevelXP}
                    totalXP={progression.totalXp}
                  />

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                      icon="🔥"
                      label="Current Streak"
                      value={progression.streak.currentStreak}
                      suffix="days"
                    />
                    <StatCard
                      icon="🏆"
                      label="Best Streak"
                      value={progression.streak.longestStreak}
                      suffix="days"
                    />
                    <StatCard
                      icon="💰"
                      label="Coins"
                      value={progression.cosmeticCurrency}
                    />
                    <StatCard
                      icon="🎨"
                      label="Skins"
                      value={progression.unlockedSkins.length}
                      suffix={`/ ${skinList.length}`}
                    />
                  </div>

                  {/* Quest Summary */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <h3
                      className="font-semibold mb-3"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Quest Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        Quests Completed Today: <strong>{progression.questStats.questsCompletedToday}/3</strong>
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        Total Completed: <strong>{progression.questStats.totalQuestsCompleted}</strong>
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        XP from Quests: <strong>{progression.questStats.totalXpEarned}</strong>
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        Coins from Quests: <strong>{progression.questStats.totalCurrencyEarned}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quests Tab */}
              {activeTab === 'quests' && socket && progression && (
                <div className="space-y-4">
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Complete daily quests to earn XP and coins!
                  </p>

                  {/* Quest summary */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Today's Progress
                      </h3>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--color-text-accent)' }}
                      >
                        {progression.questStats.questsCompletedToday}/3
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(progression.questStats.questsCompletedToday / 3) * 100}%`,
                          backgroundColor: 'var(--color-text-accent)',
                        }}
                      />
                    </div>

                    <div
                      className="mt-3 grid grid-cols-2 gap-2 text-sm"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <div>Total XP Earned: <strong>{progression.questStats.totalXpEarned}</strong></div>
                      <div>Total Coins: <strong>{progression.questStats.totalCurrencyEarned}</strong></div>
                    </div>
                  </div>

                  <p
                    className="text-xs text-center"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    New quests available daily at midnight UTC
                  </p>
                </div>
              )}

              {/* Calendar Tab */}
              {activeTab === 'calendar' && weeklyProgress && (
                <WeeklyCalendar
                  calendar={weeklyCalendar}
                  daysClaimed={weeklyProgress.daysClaimed}
                  currentDayOfWeek={weeklyProgress.currentDayOfWeek}
                  onClaimReward={handleClaimWeeklyReward}
                  isLoading={isClaimingReward}
                />
              )}

              {/* Skins Tab */}
              {activeTab === 'skins' && progression && (
                <div className="space-y-4">
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Unlock new skins by reaching higher levels. Your current level: <strong>{progression.level}</strong>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {skinList.map((skinItem) => {
                      const isUnlocked = isSkinUnlocked(skinItem.id);
                      const requiredLevel = getRequiredLevel(skinItem.id);
                      const isActive = skinId === skinItem.id;

                      return (
                        <button
                          key={skinItem.id}
                          onClick={() => isUnlocked && setSkin(skinItem.id as SkinId)}
                          disabled={!isUnlocked}
                          className={`
                            relative p-3 rounded-lg text-left transition-all
                            ${isActive
                              ? 'ring-2 ring-blue-500'
                              : isUnlocked
                                ? 'hover:scale-[1.02] cursor-pointer'
                                : 'opacity-60 cursor-not-allowed'
                            }
                          `}
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: `1px solid ${isActive ? 'var(--color-text-accent)' : 'var(--color-border-subtle)'}`,
                          }}
                        >
                          {/* Lock overlay */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 z-10">
                              <div className="text-center">
                                <span className="text-2xl">🔒</span>
                                <p className="text-xs text-white mt-1">Level {requiredLevel}</p>
                              </div>
                            </div>
                          )}

                          {/* Preview gradient */}
                          <div
                            className="w-full h-12 rounded mb-2"
                            style={{ background: skinItem.preview }}
                          />

                          {/* Skin info */}
                          <h4
                            className="font-medium text-sm"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {skinItem.name}
                          </h4>
                          <p
                            className="text-xs line-clamp-1"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {skinItem.description}
                          </p>

                          {/* Active indicator */}
                          {isActive && (
                            <span className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: string;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div
      className="p-3 rounded-lg text-center"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="text-xl mb-1">{icon}</div>
      <div
        className="text-lg font-bold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {value.toLocaleString()}
        {suffix && (
          <span
            className="text-xs font-normal ml-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {suffix}
          </span>
        )}
      </div>
      <div
        className="text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </div>
    </div>
  );
}

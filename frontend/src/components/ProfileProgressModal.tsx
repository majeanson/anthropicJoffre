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
import { createPortal } from 'react-dom';
import { Socket } from 'socket.io-client';
import { LevelProgressBar } from './LevelProgressBar';
import { WeeklyCalendar, WeeklyCalendarDay } from './WeeklyCalendar';
import { RewardsTab } from './RewardsTab';
import { useSkin, type SkinId, type CardSkinId } from '../contexts/SkinContext';
import { skinList, getSkinPricing } from '../config/skins';
import { cardSkinList, getCardSkinPricing } from '../config/cardSkins';
import { Card } from './Card';
import { Button, ProgressBar, UIBadge, UICard } from './ui';

export type TabId = 'overview' | 'quests' | 'calendar' | 'skins' | 'rewards';

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

export interface ProfileProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  socket: Socket | null;
  initialTab?: TabId;
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
  initialTab = 'overview',
}: ProfileProgressModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [progression, setProgression] = useState<PlayerProgression | null>(null);
  const [_skinRequirements, setSkinRequirements] = useState<SkinRequirement[]>([]);
  const [weeklyCalendar, setWeeklyCalendar] = useState<WeeklyCalendarDay[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [quests, setQuests] = useState<PlayerQuest[]>([]);
  const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);
  const [questNotification, setQuestNotification] = useState<string | null>(null);

  const {
    skinId,
    setSkin,
    cardSkinId,
    setCardSkin,
    startPreviewSkin,
    startPreviewCardSkin,
    stopPreview,
    isPreviewActive,
    setCosmeticCurrency,
    setUnlockedSkinIds,
  } = useSkin();

  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Update activeTab when initialTab changes (when modal opens with different tab)
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch all data on open
  useEffect(() => {
    if (!isOpen || !socket || !playerName) return;

    setIsLoading(true);

    // Request all data
    socket.emit('get_player_progression', { playerName });
    socket.emit('get_skin_requirements');
    socket.emit('get_weekly_calendar');
    socket.emit('get_player_weekly_progress', { playerName });
    socket.emit('get_daily_quests', { playerName });

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

    // Quest handlers
    const handleDailyQuests = (data: { quests: PlayerQuest[] }) => {
      setQuests(data.quests);
    };

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
      setQuestNotification(
        `Claimed: +${data.rewards.xp} XP, +${data.rewards.currency} coins!`
      );
      setTimeout(() => setQuestNotification(null), 5000);
      setClaimingQuestId(null);
      // Refresh progression data
      socket.emit('get_player_progression', { playerName });
    };

    // Skin purchase handler
    const handleSkinPurchaseResult = (data: {
      success: boolean;
      skinId?: string;
      skinType?: 'ui' | 'card';
      newBalance?: number;
      unlockedSkins?: string[];
      error?: string;
    }) => {
      setIsPurchasing(false);
      if (data.success) {
        setPurchaseSuccess(`Successfully purchased ${data.skinId}!`);
        setTimeout(() => setPurchaseSuccess(null), 3000);
        if (data.newBalance !== undefined) {
          setCosmeticCurrency(data.newBalance);
        }
        if (data.unlockedSkins) {
          setUnlockedSkinIds(data.unlockedSkins);
        }
        // Refresh progression data
        socket.emit('get_player_progression', { playerName });
      } else {
        setPurchaseError(data.error || 'Purchase failed');
        setTimeout(() => setPurchaseError(null), 3000);
      }
    };

    socket.on('player_progression', handleProgression);
    socket.on('skin_requirements', handleSkinRequirements);
    socket.on('weekly_calendar', handleWeeklyCalendar);
    socket.on('weekly_progress', handleWeeklyProgress);
    socket.on('weekly_reward_claimed', handleWeeklyRewardClaimed);
    socket.on('daily_quests', handleDailyQuests);
    socket.on('quest_reward_claimed', handleQuestRewardClaimed);
    socket.on('skin_purchase_result', handleSkinPurchaseResult);

    return () => {
      socket.off('player_progression', handleProgression);
      socket.off('skin_requirements', handleSkinRequirements);
      socket.off('weekly_calendar', handleWeeklyCalendar);
      socket.off('weekly_progress', handleWeeklyProgress);
      socket.off('weekly_reward_claimed', handleWeeklyRewardClaimed);
      socket.off('daily_quests', handleDailyQuests);
      socket.off('quest_reward_claimed', handleQuestRewardClaimed);
      socket.off('skin_purchase_result', handleSkinPurchaseResult);
    };
  }, [isOpen, socket, playerName, setCosmeticCurrency, setUnlockedSkinIds]);

  const handleClaimWeeklyReward = useCallback((dayNumber: number) => {
    if (!socket || !playerName) return;
    setIsClaimingReward(true);
    socket.emit('claim_weekly_reward', { playerName, dayNumber });
  }, [socket, playerName]);

  const handleClaimQuestReward = useCallback((questId: number) => {
    if (!socket || claimingQuestId) return;
    setClaimingQuestId(questId);
    socket.emit('claim_quest_reward', { playerName, questId });
  }, [socket, playerName, claimingQuestId]);

  // Purchase skin handler
  const handlePurchaseSkin = useCallback((skinIdToBuy: string, skinType: 'ui' | 'card') => {
    if (!socket || isPurchasing) return;

    const pricing = skinType === 'ui'
      ? getSkinPricing(skinIdToBuy as SkinId)
      : getCardSkinPricing(skinIdToBuy as CardSkinId);

    if (pricing.price <= 0) return; // Can't purchase free skins

    setIsPurchasing(true);
    setPurchaseError(null);
    socket.emit('purchase_skin', {
      skinId: skinIdToBuy,
      price: pricing.price,
      skinType,
    });
  }, [socket, isPurchasing]);

  // Stop preview when modal closes
  useEffect(() => {
    if (!isOpen && isPreviewActive) {
      stopPreview();
    }
  }, [isOpen, isPreviewActive, stopPreview]);

  if (!isOpen) return null;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'quests', label: 'Quests', icon: '🎯' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'skins', label: 'Skins', icon: '🎨' },
  ];

  // Use portal to ensure modal renders at document.body level, avoiding stacking context issues
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[10000]"
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

              {/* Rewards Tab */}
              {activeTab === 'rewards' && progression && (
                <RewardsTab
                  playerLevel={progression.level}
                  totalXp={progression.totalXp}
                  currentLevelXP={progression.currentLevelXP}
                  nextLevelXP={progression.nextLevelXP}
                />
              )}

              {/* Quests Tab */}
              {activeTab === 'quests' && socket && progression && (
                <div className="space-y-4">
                  {/* Notification */}
                  {questNotification && (
                    <UICard variant="gradient" gradient="success" size="sm" className="text-center animate-pulse">
                      <p className="text-green-900 dark:text-white">{questNotification}</p>
                    </UICard>
                  )}

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
                        {quests.filter(q => q.completed).length}/{quests.length}
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
                          width: `${quests.length > 0 ? (quests.filter(q => q.completed).length / quests.length) * 100 : 0}%`,
                          backgroundColor: 'var(--color-text-accent)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quest List */}
                  {quests.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xl mb-2">📋</p>
                      <p style={{ color: 'var(--color-text-muted)' }}>No quests available</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Check back tomorrow for new quests!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quests.map((quest) => {
                        if (!quest.template) return null;
                        const getDifficultyLabel = (type: 'easy' | 'medium' | 'hard') =>
                          type.charAt(0).toUpperCase() + type.slice(1);

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
                                <span className="text-2xl">{quest.template.icon}</span>
                                <div>
                                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                    {quest.template.name}
                                  </h3>
                                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
                                  <span style={{ color: 'var(--color-info)' }}>⭐</span>
                                  <span style={{ color: 'var(--color-text-secondary)' }}>
                                    {quest.template.reward_xp} XP
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span style={{ color: 'var(--color-warning)' }}>💰</span>
                                  <span style={{ color: 'var(--color-text-secondary)' }}>
                                    {quest.template.reward_currency} coins
                                  </span>
                                </div>
                              </div>

                              {/* Claim Button */}
                              {quest.completed && !quest.reward_claimed ? (
                                <Button
                                  onClick={() => handleClaimQuestReward(quest.id)}
                                  disabled={claimingQuestId === quest.id}
                                  variant="success"
                                  size="sm"
                                >
                                  {claimingQuestId === quest.id ? 'Claiming...' : 'Claim'}
                                </Button>
                              ) : quest.reward_claimed ? (
                                <span style={{ color: 'var(--color-success)' }} className="font-semibold text-sm">✓ Claimed</span>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }} className="text-sm">In Progress</span>
                              )}
                            </div>
                          </UICard>
                        );
                      })}
                    </div>
                  )}

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
                <div className="space-y-6">
                  {/* Balance and status bar */}
                  <div
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Level: <strong style={{ color: 'var(--color-text-primary)' }}>{progression.level}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--color-warning)' }}>💰</span>
                      <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {progression.cosmeticCurrency.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Purchase notifications */}
                  {purchaseSuccess && (
                    <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm text-center animate-pulse">
                      ✓ {purchaseSuccess}
                    </div>
                  )}
                  {purchaseError && (
                    <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm text-center">
                      ✕ {purchaseError}
                    </div>
                  )}

                  {/* Preview indicator */}
                  {isPreviewActive && (
                    <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/50 text-white text-xs text-center flex items-center justify-center gap-2">
                      <span>👁️ Preview Mode - Hover to preview skins</span>
                      <button
                        onClick={stopPreview}
                        className="underline hover:text-blue-200 font-medium"
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  {/* Card Skins Section */}
                  <div>
                    <h3
                      className="font-semibold mb-3 flex items-center gap-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span>🃏</span> Card Skins
                    </h3>
                    <p
                      className="text-xs mb-3"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Hover to preview. Purchase to own permanently.
                    </p>

                    {/* Live Preview */}
                    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] mb-4">
                      <p className="text-xs text-[var(--color-text-muted)] mb-3 text-center uppercase tracking-wider">
                        Live Preview
                      </p>
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Card card={{ color: 'red', value: 5 }} size="small" />
                        <Card card={{ color: 'blue', value: 6 }} size="small" />
                        <Card card={{ color: 'green', value: 1 }} size="small" />
                        <Card card={{ color: 'brown', value: 7 }} size="small" />
                        <Card card={{ color: 'red', value: 0 }} size="small" />
                        <Card card={{ color: 'brown', value: 0 }} size="small" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cardSkinList.map((cardSkinItem) => {
                        const pricing = getCardSkinPricing(cardSkinItem.id);
                        // A skin is unlocked if: it's free (price 0) OR player has purchased it
                        const isUnlocked = pricing.price === 0 || progression.unlockedSkins.includes(cardSkinItem.id);
                        const isActive = cardSkinId === cardSkinItem.id;
                        const canAfford = progression.cosmeticCurrency >= pricing.price;

                        return (
                          <div
                            key={cardSkinItem.id}
                            className={`
                              relative p-3 rounded-lg text-left transition-all
                              ${isActive
                                ? 'ring-2 ring-blue-500'
                                : 'hover:ring-1 hover:ring-purple-500/50'
                              }
                            `}
                            style={{
                              backgroundColor: 'var(--color-bg-secondary)',
                              border: `1px solid ${isActive ? 'var(--color-text-accent)' : 'var(--color-border-subtle)'}`,
                            }}
                            onMouseEnter={() => startPreviewCardSkin(cardSkinItem.id)}
                            onMouseLeave={stopPreview}
                          >
                            {/* Preview gradient with mini cards */}
                            <div
                              className="w-full h-12 rounded mb-2 flex items-center justify-center gap-1"
                              style={{ background: cardSkinItem.preview }}
                            >
                              {[5, 7, 3].map((val, idx) => (
                                <div
                                  key={idx}
                                  className="w-6 h-9 rounded text-white font-bold text-xs flex items-center justify-center"
                                  style={{
                                    backgroundColor: cardSkinItem.suits[['red', 'blue', 'green'][idx] as 'red' | 'blue' | 'green'].color,
                                    fontFamily: cardSkinItem.fontFamily,
                                  }}
                                >
                                  {cardSkinItem.formatValue(val, false)}
                                </div>
                              ))}
                            </div>

                            {/* Skin info */}
                            <h4
                              className="font-medium text-sm"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {cardSkinItem.name}
                            </h4>
                            <p
                              className="text-xs line-clamp-1 mb-2"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {cardSkinItem.description}
                            </p>

                            {/* Action buttons */}
                            <div className="flex items-center justify-between">
                              {isUnlocked ? (
                                <>
                                  {isActive ? (
                                    <span className="text-xs px-2 py-1 rounded bg-blue-500 text-white">
                                      Active
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setCardSkin(cardSkinItem.id)}
                                      className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    >
                                      Select
                                    </button>
                                  )}
                                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    ✓ Owned
                                  </span>
                                </>
                              ) : (
                                <>
                                  {pricing.price > 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePurchaseSkin(cardSkinItem.id, 'card');
                                      }}
                                      disabled={!canAfford || isPurchasing}
                                      className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors ${
                                        canAfford
                                          ? 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50 border border-yellow-500/50'
                                          : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      <span>💰</span>
                                      <span>Buy {pricing.price}</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                      Free
                                    </span>
                                  )}
                                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    Lvl {pricing.suggestedLevel}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* UI Theme Skins Section */}
                  <div>
                    <h3
                      className="font-semibold mb-3 flex items-center gap-2"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <span>🎨</span> UI Themes
                    </h3>
                    <p
                      className="text-xs mb-3"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Hover to preview. The entire interface will change!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {skinList.map((skinItem) => {
                        const pricing = getSkinPricing(skinItem.id as SkinId);
                        // A skin is unlocked if: it's free (price 0) OR player has purchased it
                        const isUnlocked = pricing.price === 0 || progression.unlockedSkins.includes(skinItem.id);
                        const isActive = skinId === skinItem.id;
                        const canAfford = progression.cosmeticCurrency >= pricing.price;

                        return (
                          <div
                            key={skinItem.id}
                            className={`
                              relative p-3 rounded-lg text-left transition-all
                              ${isActive
                                ? 'ring-2 ring-blue-500'
                                : 'hover:ring-1 hover:ring-purple-500/50'
                              }
                            `}
                            style={{
                              backgroundColor: 'var(--color-bg-secondary)',
                              border: `1px solid ${isActive ? 'var(--color-text-accent)' : 'var(--color-border-subtle)'}`,
                            }}
                            onMouseEnter={() => startPreviewSkin(skinItem.id as SkinId)}
                            onMouseLeave={stopPreview}
                          >
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
                              className="text-xs line-clamp-1 mb-2"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {skinItem.description}
                            </p>

                            {/* Action buttons */}
                            <div className="flex items-center justify-between">
                              {isUnlocked ? (
                                <>
                                  {isActive ? (
                                    <span className="text-xs px-2 py-1 rounded bg-blue-500 text-white">
                                      Active
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setSkin(skinItem.id as SkinId)}
                                      className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    >
                                      Select
                                    </button>
                                  )}
                                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    ✓ Owned
                                  </span>
                                </>
                              ) : (
                                <>
                                  {pricing.price > 0 ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePurchaseSkin(skinItem.id, 'ui');
                                      }}
                                      disabled={!canAfford || isPurchasing}
                                      className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors ${
                                        canAfford
                                          ? 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50 border border-yellow-500/50'
                                          : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      <span>💰</span>
                                      <span>Buy {pricing.price}</span>
                                    </button>
                                  ) : (
                                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                      Free
                                    </span>
                                  )}
                                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                    Lvl {pricing.suggestedLevel}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
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

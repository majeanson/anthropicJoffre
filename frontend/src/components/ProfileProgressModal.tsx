/**
 * ProfileProgressModal Component
 *
 * Sprint 20: Unified Player Progression
 *
 * Tabbed modal showing all player progression:
 * - Overview: Level, XP, streak, quick stats
 * - Achievements: Achievement list with filters
 * - Rewards: Level-up rewards
 * - Quests: Daily quests with progress
 * - Calendar: 7-day weekly rewards
 * - Skins: Skin collection with lock status
 *
 * Refactored to use sub-components in ProfileProgress folder.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Socket } from 'socket.io-client';
import { WeeklyCalendar, WeeklyCalendarDay } from './WeeklyCalendar';
import { RewardsTab } from './RewardsTab';
import { useSkin, useSpecialCardSkins, type SkinId, type CardSkinId } from '../contexts/SkinContext';
import { getSkinPricing } from '../config/skins';
import { getCardSkinPricing } from '../config/cardSkins';
import { AchievementProgress } from '../types/achievements';
import { OverviewTab, AchievementsTab, QuestsTab, SkinsTab } from './ProfileProgress';

export type TabId = 'overview' | 'quests' | 'calendar' | 'skins' | 'rewards' | 'achievements';

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
  const [weeklyCalendar, setWeeklyCalendar] = useState<WeeklyCalendarDay[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [quests, setQuests] = useState<PlayerQuest[]>([]);
  const [claimingQuestId, setClaimingQuestId] = useState<number | null>(null);
  const [questNotification, setQuestNotification] = useState<string | null>(null);

  // Achievements state
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementPoints, setAchievementPoints] = useState(0);

  const {
    skinId,
    setSkin,
    cardSkinId,
    setCardSkin,
    startPreviewSkin,
    startPreviewCardSkin,
    stopPreview,
    isPreviewActive,
    previewSkinId,
    previewCardSkinId,
    setCosmeticCurrency,
    setUnlockedSkinIds,
  } = useSkin();

  const {
    equippedSpecialSkins,
    setEquippedSpecialSkins,
    redZeroSkins,
    brownZeroSkins,
    startPreviewSpecialSkin,
    previewSpecialSkins,
  } = useSpecialCardSkins();

  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Update activeTab when initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch all data on open
  useEffect(() => {
    if (!isOpen || !socket || !playerName) return;

    setIsLoading(true);

    socket.emit('get_player_progression', { playerName });
    socket.emit('get_skin_requirements');
    socket.emit('get_weekly_calendar');
    socket.emit('get_player_weekly_progress', { playerName });
    socket.emit('get_daily_quests', { playerName });

    setAchievementsLoading(true);
    socket.emit(
      'get_player_achievements',
      { playerName },
      (response: {
        success: boolean;
        achievements?: AchievementProgress[];
        points?: number;
        error?: string;
      }) => {
        if (response.success && response.achievements) {
          setAchievements(response.achievements);
          setAchievementPoints(response.points || 0);
        }
        setAchievementsLoading(false);
      }
    );

    const handleProgression = (data: PlayerProgression) => {
      setProgression(data);
      setIsLoading(false);
    };

    const handleWeeklyCalendar = (data: { calendar: WeeklyCalendarDay[] }) => {
      setWeeklyCalendar(data.calendar);
    };

    const handleWeeklyProgress = (data: WeeklyProgress) => {
      setWeeklyProgress(data);
    };

    const handleWeeklyRewardClaimed = () => {
      setIsClaimingReward(false);
      socket.emit('get_player_progression', { playerName });
      socket.emit('get_player_weekly_progress', { playerName });
    };

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
      setQuestNotification(`Claimed: +${data.rewards.xp} XP, +${data.rewards.currency} coins!`);
      setTimeout(() => setQuestNotification(null), 5000);
      setClaimingQuestId(null);
      socket.emit('get_player_progression', { playerName });
    };

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
        socket.emit('get_player_progression', { playerName });
      } else {
        setPurchaseError(data.error || 'Purchase failed');
        setTimeout(() => setPurchaseError(null), 3000);
      }
    };

    socket.on('player_progression', handleProgression);
    socket.on('weekly_calendar', handleWeeklyCalendar);
    socket.on('weekly_progress', handleWeeklyProgress);
    socket.on('weekly_reward_claimed', handleWeeklyRewardClaimed);
    socket.on('daily_quests', handleDailyQuests);
    socket.on('quest_reward_claimed', handleQuestRewardClaimed);
    socket.on('skin_purchase_result', handleSkinPurchaseResult);

    return () => {
      socket.off('player_progression', handleProgression);
      socket.off('weekly_calendar', handleWeeklyCalendar);
      socket.off('weekly_progress', handleWeeklyProgress);
      socket.off('weekly_reward_claimed', handleWeeklyRewardClaimed);
      socket.off('daily_quests', handleDailyQuests);
      socket.off('quest_reward_claimed', handleQuestRewardClaimed);
      socket.off('skin_purchase_result', handleSkinPurchaseResult);
    };
  }, [isOpen, socket, playerName, setCosmeticCurrency, setUnlockedSkinIds]);

  const handleClaimWeeklyReward = useCallback(
    (dayNumber: number) => {
      if (!socket || !playerName) return;
      setIsClaimingReward(true);
      socket.emit('claim_weekly_reward', { playerName, dayNumber });
    },
    [socket, playerName]
  );

  const handleClaimQuestReward = useCallback(
    (questId: number) => {
      if (!socket || claimingQuestId) return;
      setClaimingQuestId(questId);
      socket.emit('claim_quest_reward', { playerName, questId });
    },
    [socket, playerName, claimingQuestId]
  );

  const handlePurchaseSkin = useCallback(
    (skinIdToBuy: string, skinType: 'ui' | 'card') => {
      if (!socket || isPurchasing) return;

      const pricing =
        skinType === 'ui'
          ? getSkinPricing(skinIdToBuy as SkinId)
          : getCardSkinPricing(skinIdToBuy as CardSkinId);

      if (pricing.price <= 0) return;

      setIsPurchasing(true);
      setPurchaseError(null);
      socket.emit('purchase_skin', {
        skinId: skinIdToBuy,
        price: pricing.price,
        skinType,
      });
    },
    [socket, isPurchasing]
  );

  // Wrapper for setting equipped special skins that also persists to backend
  const handleSetEquippedSpecialSkins = useCallback(
    (newEquipped: typeof equippedSpecialSkins) => {
      // Update local state
      setEquippedSpecialSkins(newEquipped);

      // Persist each changed skin to backend
      if (socket) {
        if (newEquipped.redZeroSkin !== equippedSpecialSkins.redZeroSkin) {
          socket.emit('equip_special_card_skin', {
            skinId: newEquipped.redZeroSkin,
            cardType: 'red_zero',
          });
        }
        if (newEquipped.brownZeroSkin !== equippedSpecialSkins.brownZeroSkin) {
          socket.emit('equip_special_card_skin', {
            skinId: newEquipped.brownZeroSkin,
            cardType: 'brown_zero',
          });
        }
      }
    },
    [socket, setEquippedSpecialSkins, equippedSpecialSkins]
  );

  // Stop preview when modal closes
  useEffect(() => {
    if (!isOpen && isPreviewActive) {
      stopPreview();
    }
  }, [isOpen, isPreviewActive, stopPreview]);

  // Close modal on Escape key for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'quests', label: 'Quests', icon: '🎯' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'skins', label: 'Skins', icon: '🎨' },
  ];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[10000] bg-black/60"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl bg-skin-primary border border-skin-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-skin-subtle">
          <h2 className="text-xl font-bold text-skin-primary">{playerName}'s Progress</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-skin-tertiary transition-colors text-skin-secondary"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-skin-subtle">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 px-4 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-b-2 text-skin-accent border-skin-accent'
                    : 'hover:bg-skin-tertiary text-skin-secondary border-transparent'
                }
              `}
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
              {activeTab === 'overview' && progression && (
                <OverviewTab progression={progression} />
              )}

              {activeTab === 'achievements' && (
                <AchievementsTab
                  achievements={achievements}
                  achievementPoints={achievementPoints}
                  isLoading={achievementsLoading}
                />
              )}

              {activeTab === 'rewards' && progression && (
                <RewardsTab
                  playerLevel={progression.level}
                  totalXp={progression.totalXp}
                  currentLevelXP={progression.currentLevelXP}
                  nextLevelXP={progression.nextLevelXP}
                />
              )}

              {activeTab === 'quests' && socket && progression && (
                <QuestsTab
                  quests={quests}
                  questNotification={questNotification}
                  claimingQuestId={claimingQuestId}
                  onClaimReward={handleClaimQuestReward}
                />
              )}

              {activeTab === 'calendar' && weeklyProgress && (
                <WeeklyCalendar
                  calendar={weeklyCalendar}
                  daysClaimed={weeklyProgress.daysClaimed}
                  currentDayOfWeek={weeklyProgress.currentDayOfWeek}
                  onClaimReward={handleClaimWeeklyReward}
                  isLoading={isClaimingReward}
                />
              )}

              {activeTab === 'skins' && progression && (
                <SkinsTab
                  progression={progression}
                  skinId={skinId}
                  cardSkinId={cardSkinId}
                  equippedSpecialSkins={equippedSpecialSkins}
                  isPreviewActive={isPreviewActive}
                  previewSkinId={previewSkinId}
                  previewCardSkinId={previewCardSkinId}
                  previewSpecialSkins={previewSpecialSkins}
                  redZeroSkins={redZeroSkins}
                  brownZeroSkins={brownZeroSkins}
                  setSkin={setSkin}
                  setCardSkin={setCardSkin}
                  setEquippedSpecialSkins={handleSetEquippedSpecialSkins}
                  startPreviewSkin={startPreviewSkin}
                  startPreviewCardSkin={startPreviewCardSkin}
                  startPreviewSpecialSkin={startPreviewSpecialSkin}
                  stopPreview={stopPreview}
                  isPurchasing={isPurchasing}
                  purchaseError={purchaseError}
                  purchaseSuccess={purchaseSuccess}
                  onPurchaseSkin={handlePurchaseSkin}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

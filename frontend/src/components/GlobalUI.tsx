/**
 * GlobalUI Component
 * Contains all global UI elements that should be rendered across all phases
 * Extracted from App.tsx to prevent remounting issues
 */

import React, { Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import { useModals } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { ReconnectingBanner } from './ReconnectingBanner';
import { Toast, ToastProps } from './Toast';
import { AchievementUnlocked } from './AchievementUnlocked';
import FriendRequestNotification from './FriendRequestNotification';
import EmailVerificationBanner from './EmailVerificationBanner';
import { Achievement } from '../types/achievements';
import { FriendRequestNotification as FriendRequestNotificationType } from '../types/friends';
import { useBotManagement } from '../hooks/useBotManagement';

// Lazy load heavy modals for better initial load performance
// Sprint 8 Task 3: Added NotificationCenter to lazy loading
const BotManagementPanel = lazy(() => import('./BotManagementPanel').then(m => ({ default: m.BotManagementPanel })));
const FriendsPanel = lazy(() => import('./FriendsPanel'));
const AchievementsPanel = lazy(() => import('./AchievementsPanel').then(m => ({ default: m.AchievementsPanel })));
const CatchUpModal = lazy(() => import('./CatchUpModal').then(m => ({ default: m.CatchUpModal })));
const LoginModal = lazy(() => import('./LoginModal'));
const RegisterModal = lazy(() => import('./RegisterModal'));
const PasswordResetModal = lazy(() => import('./PasswordResetModal'));
const NotificationCenter = lazy(() => import('./NotificationCenter').then(m => ({ default: m.NotificationCenter })));
// Note: Old DailyQuestsPanel and 30-day RewardsCalendar removed - use ProfileProgressModal tabs instead
// Sprint 20: Replaced PersonalHub with unified ProfileProgressModal
const ProfileProgressModal = lazy(() => import('./ProfileProgressModal').then(m => ({ default: m.ProfileProgressModal })));
import type { TabId } from './ProfileProgressModal';
const LevelUpModal = lazy(() => import('./LevelUpModal').then(m => ({ default: m.LevelUpModal })));
const DirectMessagesPanel = lazy(() => import('./DirectMessagesPanel').then(m => ({ default: m.DirectMessagesPanel })));

interface GlobalUIProps {
  reconnecting: boolean;
  reconnectAttempt: number;
  toast: ToastProps | null;
  setToast: (toast: ToastProps | null) => void;
  gameState: GameState | null;
  showCatchUpModal: boolean;
  setShowCatchUpModal: (show: boolean) => void;
  missedActions: unknown[];
  setMissedActions: (actions: unknown[]) => void;
  showBotManagement: boolean;
  setShowBotManagement: (show: boolean) => void;
  achievementNotification: Achievement | null;
  setAchievementNotification: (achievement: Achievement | null) => void;
  friendRequestNotification: FriendRequestNotificationType | null;
  setFriendRequestNotification: (notification: FriendRequestNotificationType | null) => void;
  showFriendsPanel: boolean;
  setShowFriendsPanel: (show: boolean) => void;
  showAchievementsPanel: boolean;
  setShowAchievementsPanel: (show: boolean) => void;
  gameId: string;
  socket: Socket | null;
  // Sprint 19: Quest system
  showQuestsPanel: boolean;
  setShowQuestsPanel: (show: boolean) => void;
  showRewardsCalendar: boolean;
  setShowRewardsCalendar: (show: boolean) => void;
  showPersonalHub: boolean;
  setShowPersonalHub: (show: boolean) => void;
  currentPlayerName: string;
  onOpenProfile?: () => void;
  // Sprint 20: Level up celebration
  levelUpData: { oldLevel: number; newLevel: number; newlyUnlockedSkins: string[] } | null;
  setLevelUpData: (data: { oldLevel: number; newLevel: number; newlyUnlockedSkins: string[] } | null) => void;
  // Direct Messages
  showDirectMessages: boolean;
  setShowDirectMessages: (show: boolean) => void;
  dmRecipient: string | null;
  setDmRecipient: (recipient: string | null) => void;
}

const GlobalUI: React.FC<GlobalUIProps> = ({
  reconnecting,
  reconnectAttempt,
  toast,
  setToast,
  gameState,
  showCatchUpModal,
  setShowCatchUpModal,
  setMissedActions,
  showBotManagement,
  setShowBotManagement,
  achievementNotification,
  setAchievementNotification,
  friendRequestNotification,
  setFriendRequestNotification,
  showFriendsPanel,
  setShowFriendsPanel,
  showAchievementsPanel,
  setShowAchievementsPanel,
  gameId,
  socket,
  showQuestsPanel,
  setShowQuestsPanel,
  showRewardsCalendar: _showRewardsCalendar,
  setShowRewardsCalendar: _setShowRewardsCalendar,
  showPersonalHub,
  setShowPersonalHub,
  currentPlayerName,
  onOpenProfile: _onOpenProfile,
  levelUpData,
  setLevelUpData,
  showDirectMessages,
  setShowDirectMessages,
  dmRecipient,
  setDmRecipient,
}) => {
  void _onOpenProfile; // Reserved for future use
  const modals = useModals();

  // Compute initial tab for ProfileProgressModal based on which button was clicked
  const getProfileModalInitialTab = (): TabId => {
    if (showQuestsPanel) return 'quests';
    if (_showRewardsCalendar) return 'calendar';
    return 'overview';
  };

  // Check if ProfileProgressModal should be open (from any source)
  const isProfileModalOpen = showPersonalHub || showQuestsPanel || _showRewardsCalendar;

  // Close handler that resets all related states
  const handleProfileModalClose = () => {
    setShowPersonalHub(false);
    setShowQuestsPanel(false);
    _setShowRewardsCalendar(false);
  };
  const auth = useAuth();

  const {
    handleReplaceWithBot,
    handleChangeBotDifficulty,
  } = useBotManagement(socket, gameId, gameState);

  // Handler for kicking players
  const handleKickPlayer = (playerId: string) => {
    if (!socket || !gameId) return;
    socket.emit('kick_player', { gameId, playerIdToKick: playerId });
  };

  // Handler for swapping positions
  const handleSwapPosition = (targetPlayerId: string) => {
    if (!socket || !gameId) return;
    socket.emit('swap_position', { gameId, targetPlayerId });
  };

  // Handler for starting a conversation with a friend
  const handleStartConversation = (username: string) => {
    setDmRecipient(username);
    setShowDirectMessages(true);
    setShowFriendsPanel(false); // Close friends panel when opening DMs
  };

  return (
    <>
      {/* Connection & Toast UI */}
      {reconnecting && <ReconnectingBanner attempt={reconnectAttempt} maxAttempts={10} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Game-specific UI */}
      {gameState && (
        <Suspense fallback={<div />}>
          <CatchUpModal
            isOpen={showCatchUpModal}
            onClose={() => {
              setShowCatchUpModal(false);
              setMissedActions([]);
            }}
            gameState={gameState}
            currentPlayerId={socket?.id || ''}
          />
          <BotManagementPanel
            isOpen={showBotManagement}
            onClose={() => setShowBotManagement(false)}
            gameState={gameState}
            currentPlayerId={socket?.id || ''}
            onChangeBotDifficulty={handleChangeBotDifficulty}
            onReplaceWithBot={handleReplaceWithBot}
            onKickPlayer={handleKickPlayer}
            onSwapPosition={handleSwapPosition}
            creatorId={gameState.creatorId}
          />
          <AchievementsPanel
            isOpen={showAchievementsPanel}
            onClose={() => setShowAchievementsPanel(false)}
            socket={socket}
            playerName={gameState.players.find(p => p.id === socket?.id)?.name || ''}
          />
        </Suspense>
      )}

      {/* Friends & Social UI - Available everywhere (Lobby and Game) */}
      <Suspense fallback={<div />}>
        <FriendsPanel
          isOpen={showFriendsPanel}
          onClose={() => setShowFriendsPanel(false)}
          socket={socket}
          currentPlayer={auth.user?.username || gameState?.players.find(p => p.id === socket?.id)?.name || ''}
          onStartConversation={handleStartConversation}
        />
        {/* Direct Messages Panel */}
        {auth.user && (
          <DirectMessagesPanel
            isOpen={showDirectMessages}
            onClose={() => {
              setShowDirectMessages(false);
              setDmRecipient(null);
            }}
            socket={socket}
            currentUsername={auth.user.username}
            initialRecipient={dmRecipient || undefined}
          />
        )}
      </Suspense>

      {/* Achievement & Social UI */}
      {achievementNotification && (
        <AchievementUnlocked
          achievement={achievementNotification}
          onDismiss={() => setAchievementNotification(null)}
        />
      )}
      {friendRequestNotification && (
        <FriendRequestNotification
          notification={friendRequestNotification}
          onClose={() => setFriendRequestNotification(null)}
          onView={() => setShowFriendsPanel(true)}
        />
      )}

      {/* Authentication UI */}
      <Suspense fallback={<div />}>
        <NotificationCenter
          socket={socket}
          isAuthenticated={auth.isAuthenticated}
        />
      </Suspense>
      <EmailVerificationBanner />

      {/* Authentication Modals - Lazy loaded */}
      <Suspense fallback={<div />}>
        <LoginModal
          isOpen={modals.showLoginModal}
          onClose={modals.closeLoginModal}
          onSwitchToRegister={modals.switchToRegister}
          onSwitchToPasswordReset={modals.switchToPasswordReset}
        />
        <RegisterModal
          isOpen={modals.showRegisterModal}
          onClose={modals.closeRegisterModal}
          onSwitchToLogin={modals.switchToLogin}
        />
        <PasswordResetModal
          isOpen={modals.showPasswordResetModal}
          onClose={modals.closePasswordResetModal}
          onSwitchToLogin={modals.switchToLogin}
        />
      </Suspense>

      {/* Sprint 20: Unified Profile Progress Modal (replaces PersonalHub, DailyQuestsPanel, RewardsCalendar) */}
      <Suspense fallback={<div />}>
        <ProfileProgressModal
          isOpen={isProfileModalOpen}
          onClose={handleProfileModalClose}
          playerName={currentPlayerName}
          socket={socket}
          initialTab={getProfileModalInitialTab()}
        />
        {/* Sprint 20: Level Up Celebration Modal */}
        {levelUpData && (
          <LevelUpModal
            isOpen={!!levelUpData}
            onClose={() => setLevelUpData(null)}
            oldLevel={levelUpData.oldLevel}
            newLevel={levelUpData.newLevel}
            newlyUnlockedSkins={levelUpData.newlyUnlockedSkins}
          />
        )}
      </Suspense>
    </>
  );
};

export default React.memo(GlobalUI);
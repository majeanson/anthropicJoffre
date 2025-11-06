/**
 * GlobalUI Component
 * Contains all global UI elements that should be rendered across all phases
 * Extracted from App.tsx to prevent remounting issues
 */

import React, { Suspense, lazy } from 'react';
import { GameState } from '../types/game';
import { useModals } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { ReconnectingBanner } from './ReconnectingBanner';
import { Toast, ToastProps } from './Toast';
import { AchievementUnlocked } from './AchievementUnlocked';
import FriendRequestNotification from './FriendRequestNotification';
import { NotificationCenter } from './NotificationCenter';
import EmailVerificationBanner from './EmailVerificationBanner';
import { Achievement } from '../types/achievements';
import { FriendRequestNotification as FriendRequestNotificationType } from '../types/friends';
import { useBotManagement } from '../hooks/useBotManagement';

// Lazy load heavy modals for better initial load performance
const BotManagementPanel = lazy(() => import('./BotManagementPanel').then(m => ({ default: m.BotManagementPanel })));
const FriendsPanel = lazy(() => import('./FriendsPanel'));
const CatchUpModal = lazy(() => import('./CatchUpModal').then(m => ({ default: m.CatchUpModal })));
const LoginModal = lazy(() => import('./LoginModal'));
const RegisterModal = lazy(() => import('./RegisterModal'));
const PasswordResetModal = lazy(() => import('./PasswordResetModal'));

interface GlobalUIProps {
  reconnecting: boolean;
  reconnectAttempt: number;
  toast: ToastProps | null;
  setToast: (toast: ToastProps | null) => void;
  gameState: GameState | null;
  showCatchUpModal: boolean;
  setShowCatchUpModal: (show: boolean) => void;
  missedActions: any[];
  setMissedActions: (actions: any[]) => void;
  showBotManagement: boolean;
  setShowBotManagement: (show: boolean) => void;
  achievementNotification: Achievement | null;
  setAchievementNotification: (achievement: Achievement | null) => void;
  friendRequestNotification: FriendRequestNotificationType | null;
  setFriendRequestNotification: (notification: FriendRequestNotificationType | null) => void;
  showFriendsPanel: boolean;
  setShowFriendsPanel: (show: boolean) => void;
  gameId: string;
  socket: any;
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
  gameId,
  socket
}) => {
  const modals = useModals();
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
          <FriendsPanel
            isOpen={showFriendsPanel}
            onClose={() => setShowFriendsPanel(false)}
            socket={socket}
            currentPlayer={gameState.players.find(p => p.id === socket?.id)?.name || ''}
          />
        </Suspense>
      )}

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
      <NotificationCenter
        socket={socket}
        isAuthenticated={auth.isAuthenticated}
      />
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
    </>
  );
};

export default React.memo(GlobalUI);
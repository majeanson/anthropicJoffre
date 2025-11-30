/**
 * ProfileButton Component
 *
 * Reusable profile button component that displays the current user's avatar/name
 * and opens a dropdown menu with quick actions.
 *
 * Features:
 * - Shows avatar + username for authenticated users
 * - Shows "Guest" label for non-authenticated users
 * - Dropdown menu with quick actions (View Profile, Edit Profile, Logout)
 * - Opens profile modal on "View Profile" click
 * - Opens profile editor on "Edit Profile" click
 * - Compact design suitable for headers/navigation
 * - Verified badge for verified users
 *
 * Usage:
 * ```tsx
 * <ProfileButton
 *   user={user}
 *   playerName={playerName}
 *   socket={socket}
 *   onShowLogin={() => setShowLogin(true)}
 *   onShowProfileEditor={() => setShowProfileEditor(true)}
 * />
 * ```
 */

import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../types/auth';
import Avatar from './Avatar';
import { PlayerProfileModal } from './PlayerProfileModal';
import { useAuth } from '../contexts/AuthContext';
import { UIDropdownMenu, DropdownMenuItem } from './ui';

interface ProfileButtonProps {
  user: User | null;
  playerName: string;
  socket: Socket | null;
  onShowLogin?: () => void;
  onShowProfileEditor?: () => void;
  onShowPersonalHub?: () => void;
  className?: string;
  compact?: boolean;
}

export function ProfileButton({
  user,
  playerName,
  socket,
  onShowLogin,
  onShowProfileEditor,
  onShowPersonalHub,
  className = '',
  compact = false
}: ProfileButtonProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { logout } = useAuth();

  const handleViewProfile = () => {
    setShowProfileModal(true);
  };

  const handleEditProfile = () => {
    if (onShowProfileEditor) {
      onShowProfileEditor();
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleShowProgress = () => {
    if (onShowPersonalHub) {
      onShowPersonalHub();
    }
  };

  // Define dropdown menu items
  const menuItems: DropdownMenuItem[] = [
    {
      label: 'My Progress',
      icon: '🎮',
      onClick: handleShowProgress,
      'data-testid': 'my-progress-button',
    },
    {
      label: 'View Profile',
      icon: '👤',
      onClick: handleViewProfile,
      'data-testid': 'view-profile-button',
    },
    {
      label: 'Edit Profile',
      icon: '✏️',
      onClick: handleEditProfile,
      'data-testid': 'edit-profile-button',
    },
    { type: 'divider' },
    {
      label: 'Logout',
      icon: '🚪',
      onClick: handleLogout,
      danger: true,
      'data-testid': 'logout-button',
    },
  ];

  // Trigger button element
  const triggerButton = (
    <button
      onClick={!user ? onShowLogin : undefined}
      className={`flex items-center gap-3 bg-gradient-to-r from-parchment-200 to-parchment-300 dark:from-gray-700 dark:to-gray-600 hover:from-parchment-300 hover:to-parchment-400 dark:hover:from-gray-600 dark:hover:to-gray-500 px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-parchment-400 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
      title={user ? `View ${user.username}'s profile` : 'Sign in to view your profile'}
    >
      <Avatar
        username={user?.username || playerName || 'Guest'}
        avatarUrl={user?.avatar_url}
        size={compact ? "sm" : "md"}
      />
      {!compact && (
        <div className="flex flex-col items-start">
          <div className="text-xs font-medium text-umber-600 dark:text-gray-400 uppercase tracking-wide">
            My Profile
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-umber-900 dark:text-gray-100 max-w-[120px] truncate">
              {user?.username || playerName || 'Guest'}
            </span>
            {user?.is_verified && (
              <span className="text-blue-500 text-sm" title="Verified">
                ✓
              </span>
            )}
            {user && (
              <svg className="w-4 h-4 text-umber-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      )}
    </button>
  );

  // For non-authenticated users, just render the button without dropdown
  if (!user) {
    return (
      <div className="relative">
        {triggerButton}
      </div>
    );
  }

  return (
    <>
      <UIDropdownMenu
        trigger={triggerButton}
        items={menuItems}
        position="bottom-right"
        width="md"
        testId="profile-dropdown"
      />

      {/* Profile Modal */}
      {user && socket && (
        <PlayerProfileModal
          playerName={user.username}
          socket={socket}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}

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

import { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../types/auth';
import Avatar from './Avatar';
import { PlayerProfileModal } from './PlayerProfileModal';
import { useAuth } from '../contexts/AuthContext';

interface ProfileButtonProps {
  user: User | null;
  playerName: string;
  socket: Socket | null;
  onShowLogin?: () => void;
  onShowProfileEditor?: () => void;
  className?: string;
  compact?: boolean;
}

export function ProfileButton({
  user,
  playerName,
  socket,
  onShowLogin,
  onShowProfileEditor,
  className = '',
  compact = false
}: ProfileButtonProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleClick = () => {
    if (user) {
      setShowDropdown(!showDropdown);
    } else if (onShowLogin) {
      onShowLogin();
    }
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    setShowProfileModal(true);
  };

  const handleEditProfile = () => {
    setShowDropdown(false);
    if (onShowProfileEditor) {
      onShowProfileEditor();
    }
  };

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={`flex items-center gap-3 bg-gradient-to-r from-parchment-200 to-parchment-300 dark:from-gray-700 dark:to-gray-600 hover:from-parchment-300 hover:to-parchment-400 dark:hover:from-gray-600 dark:hover:to-gray-500 px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg border-2 border-parchment-400 dark:border-gray-500 ${className}`}
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

      {/* Dropdown Menu - Only for authenticated users */}
      {user && showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
          <div className="py-2">
            <button
              onClick={handleViewProfile}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <span>👤</span>
              <span>View Profile</span>
            </button>
            <button
              onClick={handleEditProfile}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <span>✏️</span>
              <span>Edit Profile</span>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {user && socket && (
        <PlayerProfileModal
          playerName={user.username}
          socket={socket}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

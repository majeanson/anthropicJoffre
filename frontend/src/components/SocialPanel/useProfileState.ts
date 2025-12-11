/**
 * useProfileState Hook
 *
 * Manages profile editing state and socket communication.
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../../types/auth';
import { sounds } from '../../utils/sounds';
import { SocialPanelTabType } from './index';

interface UseProfileStateOptions {
  socket: Socket | null;
  user: User | null;
  socialTab: SocialPanelTabType;
}

interface UseProfileStateReturn {
  profileBio: string;
  setProfileBio: (bio: string) => void;
  profileCountry: string;
  setProfileCountry: (country: string) => void;
  profileFavoriteTeam: 1 | 2 | null;
  setProfileFavoriteTeam: (team: 1 | 2 | null) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
  isSavingProfile: boolean;
  handleSaveProfile: () => void;
  handleCancelEdit: () => void;
}

export function useProfileState({
  socket,
  user,
  socialTab,
}: UseProfileStateOptions): UseProfileStateReturn {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileBio, setProfileBio] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [profileFavoriteTeam, setProfileFavoriteTeam] = useState<1 | 2 | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Fetch user's own profile when profile tab is opened
  useEffect(() => {
    if (socialTab === 'profile' && socket && user) {
      socket.emit('get_user_profile', { username: user.username });

      const handleProfileResponse = ({ username, profile }: { username: string; profile: any }) => {
        if (username === user.username && profile) {
          setProfileBio(profile.bio || '');
          setProfileCountry(profile.country || '');
          setProfileFavoriteTeam(profile.favorite_team);
        }
      };

      socket.on('user_profile_response', handleProfileResponse);

      return () => {
        socket.off('user_profile_response', handleProfileResponse);
      };
    }
  }, [socialTab, socket, user]);

  const handleSaveProfile = useCallback(() => {
    if (!socket || !user) return;

    setIsSavingProfile(true);

    const updates = {
      bio: profileBio.trim() || null,
      country: profileCountry || null,
      favorite_team: profileFavoriteTeam,
    };

    socket.emit('update_user_profile', updates);

    const handleProfileUpdated = ({ success }: { success: boolean }) => {
      setIsSavingProfile(false);
      if (success) {
        setIsEditingProfile(false);
        sounds.buttonClick();
        alert('Profile updated successfully!');
      }
    };

    socket.once('user_profile_updated', handleProfileUpdated);

    setTimeout(() => {
      if (isSavingProfile) {
        setIsSavingProfile(false);
        socket.off('user_profile_updated', handleProfileUpdated);
      }
    }, 5000);
  }, [socket, user, profileBio, profileCountry, profileFavoriteTeam, isSavingProfile]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    if (socket && user) {
      socket.emit('get_user_profile', { username: user.username });
    }
  }, [socket, user]);

  return {
    profileBio,
    setProfileBio,
    profileCountry,
    setProfileCountry,
    profileFavoriteTeam,
    setProfileFavoriteTeam,
    isEditingProfile,
    setIsEditingProfile,
    isSavingProfile,
    handleSaveProfile,
    handleCancelEdit,
  };
}

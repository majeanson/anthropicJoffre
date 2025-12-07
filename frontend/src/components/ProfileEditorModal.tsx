/**
 * ProfileEditorModal Component
 *
 * Modal wrapper for ProfileEditor that handles fetching and saving profile data.
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { User, UserProfile, UserPreferences, ProfileUpdateData } from '../types/auth';
import { ProfileEditor, ProfileData } from './ProfileEditor';
import logger from '../utils/logger';
import { Modal } from './ui/Modal';

interface ProfileEditorModalProps {
  user: User;
  onClose: () => void;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  getUserProfile: () => Promise<{
    profile: UserProfile | null;
    preferences: UserPreferences | null;
  } | null>;
  socket?: Socket | null;
}

export function ProfileEditorModal({
  user,
  onClose,
  updateProfile,
  getUserProfile,
  socket,
}: ProfileEditorModalProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerLevel, setPlayerLevel] = useState(1);

  // Fetch user profile and player level on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        if (data?.profile) {
          setProfileData({
            avatar_id: user.avatar_url || undefined,
            bio: data.profile.bio || undefined,
            country: data.profile.country || undefined,
            favorite_team: data.profile.favorite_team || null,
            visibility: data.profile.visibility || 'public',
            show_online_status: data.profile.show_online_status !== false,
            allow_friend_requests: data.profile.allow_friend_requests !== false,
          });
        } else {
          // No profile yet, use defaults with user avatar
          setProfileData({
            avatar_id: user.avatar_url || undefined,
            visibility: 'public',
            show_online_status: true,
            allow_friend_requests: true,
          });
        }
      } catch (error) {
        logger.error('Failed to fetch profile:', error);
        // Use defaults on error with user avatar
        setProfileData({
          avatar_id: user.avatar_url || undefined,
          visibility: 'public',
          show_online_status: true,
          allow_friend_requests: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getUserProfile, user]);

  // Fetch player level for avatar unlock system
  useEffect(() => {
    if (!socket || !user.username) return;

    socket.emit('get_player_progression', { playerName: user.username });

    const handleProgression = (data: { level: number }) => {
      setPlayerLevel(data.level || 1);
    };

    socket.on('player_progression', handleProgression);

    return () => {
      socket.off('player_progression', handleProgression);
    };
  }, [socket, user.username]);

  if (loading || !profileData) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Edit Profile"
        theme="purple"
        size="md"
        showCloseButton={false}
        testId="profile-editor-modal"
      >
        <div className="text-center py-8">
          <p className="text-skin-secondary">Loading profile...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Profile"
      theme="purple"
      size="md"
      testId="profile-editor-modal"
    >
      <ProfileEditor
        initialData={profileData}
        playerLevel={playerLevel}
        onSave={async (data: ProfileData) => {
          try {
            await updateProfile(data);
            onClose();
          } catch (error) {
            logger.error('Failed to update profile:', error);
          }
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}

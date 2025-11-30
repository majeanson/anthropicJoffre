/**
 * ProfileEditorModal Component
 *
 * Modal wrapper for ProfileEditor that handles fetching and saving profile data.
 */

import { useState, useEffect } from 'react';
import { User, UserProfile, UserPreferences, ProfileUpdateData } from '../types/auth';
import { ProfileEditor, ProfileData } from './ProfileEditor';
import logger from '../utils/logger';
import { Modal } from './ui/Modal';

interface ProfileEditorModalProps {
  user: User;
  onClose: () => void;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  getUserProfile: () => Promise<{ profile: UserProfile | null; preferences: UserPreferences | null } | null>;
}

export function ProfileEditorModal({
  user,
  onClose,
  updateProfile,
  getUserProfile
}: ProfileEditorModalProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile on mount
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
          <p className="text-gray-700 dark:text-gray-300">Loading profile...</p>
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

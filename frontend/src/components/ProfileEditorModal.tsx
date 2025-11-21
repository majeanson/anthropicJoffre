/**
 * ProfileEditorModal Component
 *
 * Modal wrapper for ProfileEditor that handles fetching and saving profile data.
 */

import { useState, useEffect } from 'react';
import { User, UserProfile, UserPreferences, ProfileUpdateData } from '../types/auth';
import { ProfileEditor, ProfileData } from './ProfileEditor';
import logger from '../utils/logger';

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
            avatar_id: data.profile.user_id ? user.avatar_url || undefined : undefined,
            bio: data.profile.bio || undefined,
            country: data.profile.country || undefined,
            favorite_team: data.profile.favorite_team || null,
            visibility: data.profile.visibility || 'public',
            show_online_status: data.profile.show_online_status !== false,
            allow_friend_requests: data.profile.allow_friend_requests !== false,
          });
        } else {
          // No profile yet, use defaults
          setProfileData({
            visibility: 'public',
            show_online_status: true,
            allow_friend_requests: true,
          });
        }
      } catch (error) {
        logger.error('Failed to fetch profile:', error);
        // Use defaults on error
        setProfileData({
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          <p className="text-gray-700 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-purple-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6">
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
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileEditor, ProfileData } from '../ProfileEditor';
import { UserProfile } from '../../types/auth';
import { getErrorMessage } from '../../config/errorMessages';
import logger from '../../utils/logger';
import { Button, Spinner } from '../ui';
import { PlayerStatsModalTabType } from './types';

interface ProfileTabProps {
  isOwnProfile: boolean;
  onSwitchTab: (tab: PlayerStatsModalTabType) => void;
}

export function ProfileTab({ isOwnProfile, onSwitchTab }: ProfileTabProps) {
  const { user, updateProfile, getUserProfile } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load profile data function
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await getUserProfile();
      if (data) {
        setProfile(data.profile);
      }
    } catch (error) {
      logger.error('[ProfileTab] Error loading profile:', error);
      const errorMessage = getErrorMessage(error, 'PROFILE_DATA_FAILED');
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  }, [getUserProfile]);

  // Fetch profile data on mount
  useEffect(() => {
    if (isOwnProfile) {
      loadProfile();
    }
  }, [isOwnProfile, loadProfile]);

  if (!isOwnProfile) {
    return null;
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {profileLoading && (
        <div className="text-center py-12">
          <Spinner size="lg" color="warning" />
          <p className="mt-4 text-skin-muted font-semibold">Loading profile...</p>
        </div>
      )}

      {/* Profile Error State */}
      {!profileLoading && profileError && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">
              ⚠️
            </span>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">{profileError}</p>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setProfileError(null);
                  loadProfile();
                }}
              >
                🔄 Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {!profileLoading && !profileError && (
        <ProfileEditor
          initialData={{
            avatar_id: user?.avatar_url || 'dog',
            bio: profile?.bio || undefined,
            country: profile?.country || undefined,
            favorite_team: profile?.favorite_team || null,
            visibility: profile?.visibility || 'public',
            show_online_status:
              profile?.show_online_status !== undefined ? profile.show_online_status : true,
            allow_friend_requests:
              profile?.allow_friend_requests !== undefined ? profile.allow_friend_requests : true,
          }}
          onSave={async (data: ProfileData) => {
            try {
              await updateProfile(data);
              // Refresh the profile data to show updated information
              await loadProfile();
            } catch (error) {
              logger.error('[ProfileTab] Error saving profile:', error);
            }
          }}
          onCancel={() => {
            // Switch back to round stats tab
            onSwitchTab('round');
          }}
        />
      )}
    </div>
  );
}

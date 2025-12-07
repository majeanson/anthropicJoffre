/**
 * ProfileTab Component
 *
 * Shows user profile with editing functionality.
 * Part of SocialPanel.
 */

import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { sounds } from '../../utils/sounds';
import { User } from '../../types/auth';

interface ProfileTabProps {
  user: User | null;
  profileBio: string;
  setProfileBio: (bio: string) => void;
  profileCountry: string;
  setProfileCountry: (country: string) => void;
  profileFavoriteTeam: 1 | 2 | null;
  setProfileFavoriteTeam: (team: 1 | 2 | null) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
  isSavingProfile: boolean;
  onSaveProfile: () => void;
  onCancelEdit: () => void;
  friendsCount: number;
  unreadDMCount: number;
  onOpenMessages: () => void;
  onViewFriends: () => void;
}

export function ProfileTab({
  user,
  profileBio,
  setProfileBio,
  profileCountry,
  setProfileCountry,
  profileFavoriteTeam,
  setProfileFavoriteTeam,
  isEditingProfile,
  setIsEditingProfile,
  isSavingProfile,
  onSaveProfile,
  onCancelEdit,
  friendsCount,
  unreadDMCount,
  onOpenMessages,
  onViewFriends,
}: ProfileTabProps) {
  if (!user) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-16">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-lg font-semibold">Login Required</p>
        <p className="text-sm mt-2">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-skin-tertiary rounded-lg p-4 border-2 border-skin-default">
        <div className="text-center">
          <div className="text-4xl mb-2">👤</div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{user.username}</h3>
          {user.is_verified && (
            <p className="text-xs text-skin-info mt-1 flex items-center justify-center gap-1">
              <span>✓</span>
              <span>Verified Account</span>
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Button
          onClick={() => {
            sounds.buttonClick();
            onOpenMessages();
          }}
          variant="primary"
          size="md"
          className="w-full"
        >
          💬 View Messages
          {unreadDMCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadDMCount}
            </span>
          )}
        </Button>

        <Button
          onClick={() => {
            sounds.buttonClick();
            onViewFriends();
          }}
          variant="secondary"
          size="md"
          className="w-full"
        >
          👥 View Friends ({friendsCount})
        </Button>
      </div>

      {/* Account Info */}
      <div className="bg-skin-tertiary rounded-lg p-3 border border-skin-default">
        <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">
          Account Info
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Email:</span>
            <span className="text-[var(--color-text-primary)] font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Member Since:</span>
            <span className="text-[var(--color-text-primary)] font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Editor */}
      <div className="bg-skin-tertiary rounded-lg p-3 border border-skin-default">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">Profile</h4>
          {!isEditingProfile ? (
            <Button
              onClick={() => {
                sounds.buttonClick();
                setIsEditingProfile(true);
              }}
              variant="primary"
              size="sm"
            >
              ✏️ Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  sounds.buttonClick();
                  onCancelEdit();
                }}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={onSaveProfile}
                disabled={isSavingProfile}
                variant="success"
                size="sm"
              >
                {isSavingProfile ? '⏳ Saving...' : '💾 Save'}
              </Button>
            </div>
          )}
        </div>

        {!isEditingProfile ? (
          // View Mode
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[var(--color-text-secondary)] block text-xs mb-1">Bio:</span>
              <p className="text-[var(--color-text-primary)]">
                {profileBio || <span className="text-skin-muted italic">Not set</span>}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Country:</span>
              <span className="text-[var(--color-text-primary)] font-medium">
                {profileCountry || <span className="text-skin-muted italic">Not set</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Favorite Team:</span>
              <span
                className={`font-medium ${profileFavoriteTeam === 1 ? 'text-team1' : profileFavoriteTeam === 2 ? 'text-team2' : 'text-skin-muted'}`}
              >
                {profileFavoriteTeam ? (
                  `Team ${profileFavoriteTeam}`
                ) : (
                  <span className="text-skin-muted italic">Not set</span>
                )}
              </span>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Bio (max 200 characters)
              </label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value.slice(0, 200))}
                placeholder="Tell others about yourself..."
                className="w-full px-2 py-1.5 text-sm rounded border border-skin-default bg-skin-primary text-[var(--color-text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                maxLength={200}
              />
              <div className="text-xs text-skin-muted mt-1">{profileBio.length}/200</div>
            </div>

            <Select
              label="Country"
              value={profileCountry}
              onChange={(e) => setProfileCountry(e.target.value)}
              options={[
                { value: '', label: 'Select a country...' },
                { value: 'US', label: '🇺🇸 United States' },
                { value: 'CA', label: '🇨🇦 Canada' },
                { value: 'GB', label: '🇬🇧 United Kingdom' },
                { value: 'FR', label: '🇫🇷 France' },
                { value: 'DE', label: '🇩🇪 Germany' },
                { value: 'ES', label: '🇪🇸 Spain' },
                { value: 'IT', label: '🇮🇹 Italy' },
                { value: 'JP', label: '🇯🇵 Japan' },
                { value: 'AU', label: '🇦🇺 Australia' },
                { value: 'BR', label: '🇧🇷 Brazil' },
                { value: 'MX', label: '🇲🇽 Mexico' },
                { value: 'IN', label: '🇮🇳 India' },
                { value: 'CN', label: '🇨🇳 China' },
                { value: 'KR', label: '🇰🇷 South Korea' },
              ]}
              size="sm"
            />

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Favorite Team
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setProfileFavoriteTeam(1)}
                  variant={profileFavoriteTeam === 1 ? 'warning' : 'ghost'}
                  size="sm"
                  className="flex-1"
                >
                  Team 1
                </Button>
                <Button
                  onClick={() => setProfileFavoriteTeam(2)}
                  variant={profileFavoriteTeam === 2 ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1"
                >
                  Team 2
                </Button>
                <Button
                  onClick={() => setProfileFavoriteTeam(null)}
                  variant={profileFavoriteTeam === null ? 'primary' : 'ghost'}
                  size="sm"
                  title="Clear selection"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

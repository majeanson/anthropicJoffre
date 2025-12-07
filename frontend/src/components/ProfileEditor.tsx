/**
 * Profile Editor Component
 * Sprint 3 Phase 3.2
 */

import { useState, useEffect } from 'react';
import { AvatarSelector } from './AvatarSelector';
import { getAvatarById } from '../utils/avatars';
import { Button, Checkbox, Select } from './ui';
import type { SelectOption } from './ui/Select';

export interface ProfileData {
  avatar_id?: string;
  bio?: string;
  country?: string;
  favorite_team?: 1 | 2 | null;
  visibility?: 'public' | 'friends_only' | 'private';
  show_online_status?: boolean;
  allow_friend_requests?: boolean;
}

interface ProfileEditorProps {
  initialData?: ProfileData;
  playerLevel?: number;
  onSave: (data: ProfileData) => Promise<void>;
  onCancel: () => void;
}

// Common countries for the dropdown
const COUNTRY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Not specified' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'CN', label: 'China' },
  { value: 'AU', label: 'Australia' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'IN', label: 'India' },
  { value: 'RU', label: 'Russia' },
];

// Profile visibility options
const VISIBILITY_OPTIONS: SelectOption[] = [
  { value: 'public', label: 'Public - Anyone can view' },
  { value: 'friends_only', label: 'Friends Only' },
  { value: 'private', label: 'Private - Only you' },
];

export function ProfileEditor({
  initialData,
  playerLevel = 1,
  onSave,
  onCancel,
}: ProfileEditorProps) {
  const [avatarId, setAvatarId] = useState(initialData?.avatar_id || 'dog');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [country, setCountry] = useState(initialData?.country || '');
  const [favoriteTeam, setFavoriteTeam] = useState<1 | 2 | null>(
    initialData?.favorite_team || null
  );
  const [visibility, setVisibility] = useState<'public' | 'friends_only' | 'private'>(
    initialData?.visibility || 'public'
  );
  const [showOnlineStatus, setShowOnlineStatus] = useState(
    initialData?.show_online_status !== undefined ? initialData.show_online_status : true
  );
  const [allowFriendRequests, setAllowFriendRequests] = useState(
    initialData?.allow_friend_requests !== undefined ? initialData.allow_friend_requests : true
  );

  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Sync state with initialData when it changes (e.g., after async fetch)
  useEffect(() => {
    if (initialData) {
      setAvatarId(initialData.avatar_id || 'dog');
      setBio(initialData.bio || '');
      setCountry(initialData.country || '');
      setFavoriteTeam(initialData.favorite_team || null);
      setVisibility(initialData.visibility || 'public');
      setShowOnlineStatus(
        initialData.show_online_status !== undefined ? initialData.show_online_status : true
      );
      setAllowFriendRequests(
        initialData.allow_friend_requests !== undefined ? initialData.allow_friend_requests : true
      );
    }
  }, [initialData]);

  const selectedAvatar = getAvatarById(avatarId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        avatar_id: avatarId,
        bio: bio.trim() || undefined,
        country: country || undefined,
        favorite_team: favoriteTeam,
        visibility,
        show_online_status: showOnlineStatus,
        allow_friend_requests: allowFriendRequests,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const charCount = bio.length;
  const maxChars = 200;

  return (
    <div className="space-y-6">
      {/* Avatar Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Avatar
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-6xl">
            {selectedAvatar?.emoji || '👤'}
          </div>
          <Button onClick={() => setShowAvatarSelector(!showAvatarSelector)} variant="primary">
            {showAvatarSelector ? 'Hide Avatars' : 'Change Avatar'}
          </Button>
        </div>

        {showAvatarSelector && (
          <div className="mt-4">
            <AvatarSelector
              selectedAvatarId={avatarId}
              onSelect={(id) => {
                setAvatarId(id);
                setShowAvatarSelector(false);
              }}
              playerLevel={playerLevel}
            />
          </div>
        )}
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, maxChars))}
          className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none resize-none"
          rows={3}
          placeholder="Tell us about yourself..."
          maxLength={maxChars}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {charCount}/{maxChars} characters
        </div>
      </div>

      {/* Country */}
      <Select
        id="country"
        label="Country"
        options={COUNTRY_OPTIONS}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        variant="filled"
        fullWidth
      />

      {/* Favorite Team */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Favorite Team Color
        </label>
        <div className="flex gap-3">
          <Button
            onClick={() => setFavoriteTeam(null)}
            variant={favoriteTeam === null ? 'primary' : 'ghost'}
            size="sm"
          >
            None
          </Button>
          <Button
            onClick={() => setFavoriteTeam(1)}
            variant={favoriteTeam === 1 ? 'warning' : 'ghost'}
            size="sm"
          >
            Team 1 (Orange)
          </Button>
          <Button
            onClick={() => setFavoriteTeam(2)}
            variant={favoriteTeam === 2 ? 'secondary' : 'ghost'}
            size="sm"
          >
            Team 2 (Purple)
          </Button>
        </div>
      </div>

      {/* Privacy Settings */}
      <Select
        id="visibility"
        label="Profile Visibility"
        options={VISIBILITY_OPTIONS}
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as 'public' | 'friends_only' | 'private')}
        variant="filled"
        fullWidth
      />

      {/* Toggle Settings */}
      <div className="space-y-3">
        <Checkbox
          id="showOnlineStatus"
          label="Show online status to others"
          checked={showOnlineStatus}
          onChange={(e) => setShowOnlineStatus(e.target.checked)}
          variant="toggle"
        />

        <Checkbox
          id="allowFriendRequests"
          label="Allow friend requests"
          checked={allowFriendRequests}
          onChange={(e) => setAllowFriendRequests(e.target.checked)}
          variant="toggle"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button onClick={handleSave} disabled={isSaving} variant="primary" className="flex-1">
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
        <Button onClick={onCancel} disabled={isSaving} variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Profile Editor Component
 * Sprint 3 Phase 3.2
 */

import { useState } from 'react';
import { AvatarSelector } from './AvatarSelector';
import { getAvatarById } from '../utils/avatars';

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
  onSave: (data: ProfileData) => Promise<void>;
  onCancel: () => void;
}

// Common countries for the dropdown
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'RU', name: 'Russia' },
];

export function ProfileEditor({ initialData, onSave, onCancel }: ProfileEditorProps) {
  const [avatarId, setAvatarId] = useState(initialData?.avatar_id || 'dog');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [country, setCountry] = useState(initialData?.country || '');
  const [favoriteTeam, setFavoriteTeam] = useState<1 | 2 | null>(initialData?.favorite_team || null);
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
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Avatar
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-6xl">
            {selectedAvatar?.emoji || '👤'}
          </div>
          <button
            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            {showAvatarSelector ? 'Hide Avatars' : 'Change Avatar'}
          </button>
        </div>

        {showAvatarSelector && (
          <div className="mt-4">
            <AvatarSelector
              selectedAvatarId={avatarId}
              onSelect={(id) => {
                setAvatarId(id);
                setShowAvatarSelector(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, maxChars))}
          className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
          rows={3}
          placeholder="Tell us about yourself..."
          maxLength={maxChars}
        />
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
          {charCount}/{maxChars} characters
        </div>
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Country
        </label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Not specified</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Favorite Team */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Favorite Team Color
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setFavoriteTeam(null)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              favoriteTeam === null
                ? 'bg-gray-600 text-white ring-4 ring-gray-400'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            None
          </button>
          <button
            onClick={() => setFavoriteTeam(1)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              favoriteTeam === 1
                ? 'bg-orange-600 text-white ring-4 ring-orange-400'
                : 'bg-orange-200 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-300 dark:hover:bg-orange-800/30'
            }`}
          >
            Team 1 (Orange)
          </button>
          <button
            onClick={() => setFavoriteTeam(2)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              favoriteTeam === 2
                ? 'bg-purple-600 text-white ring-4 ring-purple-400'
                : 'bg-purple-200 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-300 dark:hover:bg-purple-800/30'
            }`}
          >
            Team 2 (Purple)
          </button>
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Profile Visibility
        </label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'friends_only' | 'private')}
          className="w-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="public">Public - Anyone can view</option>
          <option value="friends_only">Friends Only</option>
          <option value="private">Private - Only you</option>
        </select>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlineStatus}
            onChange={(e) => setShowOnlineStatus(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Show online status to others
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowFriendRequests}
            onChange={(e) => setAllowFriendRequests(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Allow friend requests
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

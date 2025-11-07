/**
 * User Profile Database Operations
 * Sprint 3 Phase 3.2
 */

import { query, getPool } from './index';

export interface UserProfile {
  profile_id: number;
  user_id: number;
  bio: string | null;
  country: string | null;
  favorite_team: 1 | 2 | null;
  visibility: 'public' | 'friends_only' | 'private';
  show_online_status: boolean;
  allow_friend_requests: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  preference_id: number;
  user_id: number;
  theme: 'light' | 'dark' | 'auto';
  sound_enabled: boolean;
  sound_volume: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  autoplay_enabled: boolean;
  created_at: Date;
}

export interface ProfileUpdateData {
  bio?: string;
  country?: string;
  favorite_team?: 1 | 2 | null;
  visibility?: 'public' | 'friends_only' | 'private';
  show_online_status?: boolean;
  allow_friend_requests?: boolean;
}

export interface PreferencesUpdateData {
  theme?: 'light' | 'dark' | 'auto';
  sound_enabled?: boolean;
  sound_volume?: number;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  language?: string;
  autoplay_enabled?: boolean;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    const result = await query(
      'SELECT profile_id, user_id, bio, country, favorite_team, visibility, show_online_status, allow_friend_requests, created_at, updated_at FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Create user profile (called on user registration)
 */
export async function createUserProfile(userId: number): Promise<UserProfile | null> {
  try {
    const result = await query(
      `INSERT INTO user_profiles (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: ProfileUpdateData
): Promise<UserProfile | null> {
  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.bio !== undefined) {
      setClauses.push(`bio = $${paramIndex++}`);
      values.push(updates.bio);
    }

    if (updates.country !== undefined) {
      setClauses.push(`country = $${paramIndex++}`);
      values.push(updates.country);
    }

    if (updates.favorite_team !== undefined) {
      setClauses.push(`favorite_team = $${paramIndex++}`);
      values.push(updates.favorite_team);
    }

    if (updates.visibility !== undefined) {
      setClauses.push(`visibility = $${paramIndex++}`);
      values.push(updates.visibility);
    }

    if (updates.show_online_status !== undefined) {
      setClauses.push(`show_online_status = $${paramIndex++}`);
      values.push(updates.show_online_status);
    }

    if (updates.allow_friend_requests !== undefined) {
      setClauses.push(`allow_friend_requests = $${paramIndex++}`);
      values.push(updates.allow_friend_requests);
    }

    if (setClauses.length === 0) {
      return getUserProfile(userId);
    }

    values.push(userId);

    const result = await query(
      `UPDATE user_profiles
       SET ${setClauses.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

/**
 * Get user preferences by user ID
 */
export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  try {
    const result = await query(
      'SELECT preference_id, user_id, theme, sound_enabled, sound_volume, notifications_enabled, email_notifications, language, autoplay_enabled, created_at FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

/**
 * Create user preferences (called on user registration)
 */
export async function createUserPreferences(
  userId: number,
  preferences?: Partial<PreferencesUpdateData>
): Promise<UserPreferences | null> {
  try {
    const result = await query(
      `INSERT INTO user_preferences (
        user_id, theme, sound_enabled, sound_volume,
        notifications_enabled, email_notifications, language, autoplay_enabled
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [
        userId,
        preferences?.theme || 'dark',
        preferences?.sound_enabled !== undefined ? preferences.sound_enabled : true,
        preferences?.sound_volume !== undefined ? preferences.sound_volume : 0.30,
        preferences?.notifications_enabled !== undefined ? preferences.notifications_enabled : true,
        preferences?.email_notifications !== undefined ? preferences.email_notifications : true,
        preferences?.language || 'en',
        preferences?.autoplay_enabled !== undefined ? preferences.autoplay_enabled : false
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error creating user preferences:', error);
    return null;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: number,
  updates: PreferencesUpdateData
): Promise<UserPreferences | null> {
  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.theme !== undefined) {
      setClauses.push(`theme = $${paramIndex++}`);
      values.push(updates.theme);
    }

    if (updates.sound_enabled !== undefined) {
      setClauses.push(`sound_enabled = $${paramIndex++}`);
      values.push(updates.sound_enabled);
    }

    if (updates.sound_volume !== undefined) {
      setClauses.push(`sound_volume = $${paramIndex++}`);
      values.push(updates.sound_volume);
    }

    if (updates.notifications_enabled !== undefined) {
      setClauses.push(`notifications_enabled = $${paramIndex++}`);
      values.push(updates.notifications_enabled);
    }

    if (updates.email_notifications !== undefined) {
      setClauses.push(`email_notifications = $${paramIndex++}`);
      values.push(updates.email_notifications);
    }

    if (updates.language !== undefined) {
      setClauses.push(`language = $${paramIndex++}`);
      values.push(updates.language);
    }

    if (updates.autoplay_enabled !== undefined) {
      setClauses.push(`autoplay_enabled = $${paramIndex++}`);
      values.push(updates.autoplay_enabled);
    }

    if (setClauses.length === 0) {
      return getUserPreferences(userId);
    }

    values.push(userId);

    const result = await query(
      `UPDATE user_preferences
       SET ${setClauses.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }
}

/**
 * Get complete user profile with preferences
 */
export async function getCompleteUserProfile(userId: number): Promise<{
  profile: UserProfile | null;
  preferences: UserPreferences | null;
} | null> {
  try {
    const profile = await getUserProfile(userId);
    const preferences = await getUserPreferences(userId);

    return {
      profile,
      preferences
    };
  } catch (error) {
    console.error('Error getting complete user profile:', error);
    return null;
  }
}

/**
 * Initialize profile and preferences for new user
 */
export async function initializeUserProfileAndPreferences(
  userId: number
): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create profile
    await client.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
      [userId]
    );

    // Create preferences
    await client.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing user profile and preferences:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Profile REST API Endpoints
 * Sprint 3 Phase 3.2
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getCompleteUserProfile,
  ProfileUpdateData,
  PreferencesUpdateData
} from '../db/profiles';
import { updateUserProfile as updateUserAvatar, getUserById } from '../db/users';
import { verifyAccessToken } from '../utils/authHelpers';
import { areFriends } from '../db/friends';
import { AuthenticatedRequest } from '../types/auth';

const router = Router();

/**
 * Middleware to verify authentication
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  (req as AuthenticatedRequest).user = payload;
  next();
}

/**
 * GET /api/profiles/me
 * Get current user's profile and preferences
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.user_id;

    const data = await getCompleteUserProfile(userId);

    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/profiles/me
 * Update current user's profile
 */
router.put('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.user_id;
    const updates: ProfileUpdateData = req.body;

    // Update profile
    const profile = await updateUserProfile(userId, updates);

    if (!profile) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // If avatar_id is provided, update user's avatar_url
    interface RequestBodyWithAvatar {
      avatar_id?: string;
    }
    const body = req.body as RequestBodyWithAvatar;
    if (body.avatar_id) {
      await updateUserAvatar(userId, {
        avatar_url: body.avatar_id // Store avatar ID as avatar_url for now
      });
    }

    return res.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profiles/preferences
 * Get current user's preferences
 */
router.get('/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.user_id;

    const preferences = await getUserPreferences(userId);

    if (!preferences) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    return res.json({ preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/profiles/preferences
 * Update current user's preferences
 */
router.put('/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.user_id;
    const updates: PreferencesUpdateData = req.body;

    const preferences = await updateUserPreferences(userId, updates);

    if (!preferences) {
      return res.status(500).json({ error: 'Failed to update preferences' });
    }

    return res.json({ preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/profiles/:userId
 * Get another user's public profile
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const profile = await getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check visibility
    if (profile.visibility === 'private') {
      return res.status(403).json({ error: 'Profile is private' });
    }

    // Check friend-only visibility
    if (profile.visibility === 'friends_only') {
      // Extract requestor info from auth header (optional)
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Profile is only visible to friends' });
      }

      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      if (!payload) {
        return res.status(403).json({ error: 'Profile is only visible to friends' });
      }

      const requestorId = payload.user_id;

      // Don't block if viewing own profile
      if (requestorId === userId) {
        return res.json({ profile });
      }

      // Check friendship status
      try {
        // Get usernames for both users
        const requestorUser = await getUserById(requestorId);
        const targetUser = await getUserById(userId);

        if (!requestorUser || !targetUser) {
          return res.status(403).json({ error: 'Profile is only visible to friends' });
        }

        const isFriend = await areFriends(requestorUser.username, targetUser.username);

        if (!isFriend) {
          return res.status(403).json({ error: 'Profile is only visible to friends' });
        }
      } catch (error) {
        console.error('Error checking friendship status:', error);
        return res.status(403).json({ error: 'Profile is only visible to friends' });
      }
    }

    return res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

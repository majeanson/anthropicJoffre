/**
 * Social Helpers - Recent Players & Friend Suggestions
 * Sprint 16 Day 6
 */

import { query } from '../db/index.js';

export interface RecentPlayer {
  player_name: string;
  last_played_at: string;
  games_together: number;
  is_friend: boolean;
}

export interface FriendSuggestion {
  player_name: string;
  reason: string;
  score: number; // Suggestion relevance score
  games_together?: number;
  mutual_friends?: number;
}

/**
 * Get recent players for a user (from last N finished games)
 */
export async function getRecentPlayers(
  username: string,
  limit: number = 20
): Promise<RecentPlayer[]> {
  try {
    // Get players from recent finished games
    const result = await query(
      `SELECT
         unnested.player_name,
         MAX(gh.finished_at) AS last_played_at,
         COUNT(*) AS games_together,
         EXISTS(
           SELECT 1 FROM friendships f
           WHERE (f.player1_name = $1 AND f.player2_name = unnested.player_name)
              OR (f.player2_name = $1 AND f.player1_name = unnested.player_name)
         ) AS is_friend
       FROM game_history gh,
       unnest(gh.player_names) AS unnested(player_name)
       WHERE gh.player_names @> ARRAY[$1]::text[]
         AND unnested.player_name != $1
         AND gh.finished_at IS NOT NULL
       GROUP BY unnested.player_name
       ORDER BY last_played_at DESC, games_together DESC
       LIMIT $2`,
      [username, limit]
    );

    return result.rows.map(row => ({
      player_name: row.player_name,
      last_played_at: row.last_played_at,
      games_together: parseInt(row.games_together, 10),
      is_friend: row.is_friend
    }));
  } catch (error) {
    console.error('Error getting recent players:', error);
    return [];
  }
}

/**
 * Generate friend suggestions based on:
 * 1. Players you've played with multiple times (but not friends yet)
 * 2. Mutual friends
 * 3. Similar skill level (ELO rating)
 */
export async function getFriendSuggestions(
  username: string,
  limit: number = 10
): Promise<FriendSuggestion[]> {
  try {
    const suggestions: FriendSuggestion[] = [];

    // 1. Get players you've played with (not friends)
    const recentPlayers = await query(
      `SELECT
         unnested.player_name,
         COUNT(*) AS games_together
       FROM game_history gh,
       unnest(gh.player_names) AS unnested(player_name)
       WHERE gh.player_names @> ARRAY[$1]::text[]
         AND unnested.player_name != $1
         AND gh.finished_at IS NOT NULL
         AND NOT EXISTS(
           SELECT 1 FROM friendships f
           WHERE (f.player1_name = $1 AND f.player2_name = unnested.player_name)
              OR (f.player2_name = $1 AND f.player1_name = unnested.player_name)
         )
       GROUP BY unnested.player_name
       HAVING COUNT(*) >= 3
       ORDER BY COUNT(*) DESC
       LIMIT $2`,
      [username, limit]
    );

    for (const row of recentPlayers.rows) {
      const gamesCount = parseInt(row.games_together, 10);
      suggestions.push({
        player_name: row.player_name,
        reason: `Played together ${gamesCount} times`,
        score: gamesCount * 10,
        games_together: gamesCount
      });
    }

    // 2. Get players with mutual friends
    const mutualFriends = await query(
      `SELECT
         other_friend,
         COUNT(*) AS mutual_count
       FROM (
         -- Get my friends
         SELECT
           CASE
             WHEN player1_name = $1 THEN player2_name
             ELSE player1_name
           END AS my_friend
         FROM friendships
         WHERE player1_name = $1 OR player2_name = $1
       ) my_friends
       JOIN (
         -- Get their friends
         SELECT
           CASE
             WHEN player1_name = my_friends.my_friend THEN player2_name
             ELSE player1_name
           END AS other_friend
         FROM friendships
         WHERE player1_name = my_friends.my_friend OR player2_name = my_friends.my_friend
       ) their_friends ON true
       WHERE other_friend != $1
         AND NOT EXISTS(
           SELECT 1 FROM friendships f
           WHERE (f.player1_name = $1 AND f.player2_name = other_friend)
              OR (f.player2_name = $1 AND f.player1_name = other_friend)
         )
       GROUP BY other_friend
       HAVING COUNT(*) >= 2
       ORDER BY COUNT(*) DESC
       LIMIT $2`,
      [username, limit]
    );

    for (const row of mutualFriends.rows) {
      const mutualCount = parseInt(row.mutual_count, 10);
      const existingIndex = suggestions.findIndex(s => s.player_name === row.other_friend);

      if (existingIndex >= 0) {
        // Enhance existing suggestion
        suggestions[existingIndex].mutual_friends = mutualCount;
        suggestions[existingIndex].reason += ` • ${mutualCount} mutual friend${mutualCount > 1 ? 's' : ''}`;
        suggestions[existingIndex].score += mutualCount * 20;
      } else {
        suggestions.push({
          player_name: row.other_friend,
          reason: `${mutualCount} mutual friend${mutualCount > 1 ? 's' : ''}`,
          score: mutualCount * 20,
          mutual_friends: mutualCount
        });
      }
    }

    // 3. Get players with similar ELO (within 100 points)
    const similarSkill = await query(
      `WITH my_elo AS (
         SELECT elo_rating FROM player_stats WHERE player_name = $1
       )
       SELECT
         ps.player_name,
         ABS(ps.elo_rating - my_elo.elo_rating) AS elo_diff
       FROM player_stats ps, my_elo
       WHERE ps.player_name != $1
         AND ps.games_played >= 5
         AND ABS(ps.elo_rating - my_elo.elo_rating) <= 100
         AND NOT EXISTS(
           SELECT 1 FROM friendships f
           WHERE (f.player1_name = $1 AND f.player2_name = ps.player_name)
              OR (f.player2_name = $1 AND f.player1_name = ps.player_name)
         )
       ORDER BY elo_diff ASC
       LIMIT $2`,
      [username, limit]
    );

    for (const row of similarSkill.rows) {
      const existingIndex = suggestions.findIndex(s => s.player_name === row.player_name);

      if (existingIndex >= 0) {
        // Enhance existing suggestion
        suggestions[existingIndex].reason += ' • Similar skill level';
        suggestions[existingIndex].score += 5;
      } else {
        suggestions.push({
          player_name: row.player_name,
          reason: 'Similar skill level',
          score: 5
        });
      }
    }

    // Sort by score and limit
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('Error generating friend suggestions:', error);
    return [];
  }
}

/**
 * Get mutual friends between two players
 */
export async function getMutualFriends(
  username1: string,
  username2: string
): Promise<string[]> {
  try {
    const result = await query(
      `SELECT
         CASE
           WHEN f1.player1_name = $1 THEN f1.player2_name
           ELSE f1.player1_name
         END AS mutual_friend
       FROM friendships f1
       WHERE (f1.player1_name = $1 OR f1.player2_name = $1)
         AND EXISTS(
           SELECT 1 FROM friendships f2
           WHERE (f2.player1_name = $2 OR f2.player2_name = $2)
             AND (
               (f2.player1_name = CASE WHEN f1.player1_name = $1 THEN f1.player2_name ELSE f1.player1_name END)
               OR (f2.player2_name = CASE WHEN f1.player1_name = $1 THEN f1.player2_name ELSE f1.player1_name END)
             )
         )`,
      [username1, username2]
    );

    return result.rows.map(row => row.mutual_friend);
  } catch (error) {
    console.error('Error getting mutual friends:', error);
    return [];
  }
}

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const saveGameHistory = async (
  gameId: string,
  winningTeam: 1 | 2,
  team1Score: number,
  team2Score: number,
  rounds: number
) => {
  const text = `
    INSERT INTO game_history (game_id, winning_team, team1_score, team2_score, rounds)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [gameId, winningTeam, team1Score, team2Score, rounds];
  const result = await query(text, values);
  return result.rows[0];
};

export const getRecentGames = async (limit: number = 10) => {
  const text = `
    SELECT * FROM game_history
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const result = await query(text, [limit]);
  return result.rows;
};

export default pool;

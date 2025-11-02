# Production Database Cleanup Script

## Purpose
Remove obsolete 6-character game IDs from production database.

## Option 1: Using the Admin API Endpoint

**Prerequisites:**
- Access to production server
- Production API URL

**Steps:**

```bash
# Replace YOUR_PROD_API_URL with your actual production API URL
curl -X POST https://YOUR_PROD_API_URL/api/admin/cleanup-obsolete-games

# Expected response:
{
  "success": true,
  "message": "Successfully purged obsolete 6-character game IDs",
  "deletedCount": {
    "activeGames": 5,
    "finishedGames": 12,
    "sessions": 8
  },
  "activeGames": ["ABC123", "DEF456", ...],
  "finishedGames": ["GHI789", "JKL012", ...]
}
```

## Option 2: Direct SQL Queries

**Prerequisites:**
- Direct access to production PostgreSQL database
- psql or database admin tool

**SQL Commands:**

```sql
-- 1. Check how many 6-char game IDs exist
SELECT 'active_games' as table_name, COUNT(*) as count
FROM active_games
WHERE LENGTH(game_id) = 6
UNION ALL
SELECT 'games' as table_name, COUNT(*) as count
FROM games
WHERE LENGTH(id) = 6
UNION ALL
SELECT 'game_sessions' as table_name, COUNT(*) as count
FROM game_sessions
WHERE LENGTH(game_id) = 6;

-- 2. Preview which games will be deleted
SELECT game_id, phase, created_at
FROM active_games
WHERE LENGTH(game_id) = 6
ORDER BY created_at DESC;

-- 3. Delete from active_games table
DELETE FROM active_games
WHERE LENGTH(game_id) = 6;

-- 4. Delete from finished games table
DELETE FROM games
WHERE LENGTH(id) = 6;

-- 5. Delete from game_sessions table
DELETE FROM game_sessions
WHERE LENGTH(game_id) = 6;

-- 6. Verify deletion
SELECT 'active_games' as table_name, COUNT(*) as remaining
FROM active_games
WHERE LENGTH(game_id) = 6
UNION ALL
SELECT 'games' as table_name, COUNT(*) as remaining
FROM games
WHERE LENGTH(id) = 6
UNION ALL
SELECT 'game_sessions' as table_name, COUNT(*) as remaining
FROM game_sessions
WHERE LENGTH(game_id) = 6;
```

## Option 3: Node.js Script

**Create a file:** `scripts/cleanup-prod-6char-ids.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanup() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete from active_games
    const activeResult = await client.query(
      'DELETE FROM active_games WHERE LENGTH(game_id) = 6 RETURNING game_id'
    );

    // Delete from games
    const gamesResult = await client.query(
      'DELETE FROM games WHERE LENGTH(id) = 6 RETURNING id'
    );

    // Delete from game_sessions
    const sessionsResult = await client.query(
      'DELETE FROM game_sessions WHERE LENGTH(game_id) = 6 RETURNING game_id'
    );

    await client.query('COMMIT');

    console.log('✅ Cleanup successful!');
    console.log(`  - Active games deleted: ${activeResult.rowCount}`);
    console.log(`  - Finished games deleted: ${gamesResult.rowCount}`);
    console.log(`  - Sessions deleted: ${sessionsResult.rowCount}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup().catch(console.error);
```

**Run the script:**
```bash
cd backend
DATABASE_URL="your_prod_database_url" node scripts/cleanup-prod-6char-ids.js
```

## Verification

After running cleanup, verify in production:

1. Check lobby browser - should show no 6-char game IDs
2. Check API: `GET /api/games/lobby` - response should have no 6-char IDs
3. Check database directly using SQL query #6 above

## Notes

- ⚠️ **Make a backup before running on production!**
- The API endpoint has built-in transaction safety (auto-rollback on error)
- Current game ID format is 8 characters (e.g., "A1B2C3D4")
- All 6-character IDs are from old format and safe to delete
- Cleanup affects 3 tables: `active_games`, `games`, `game_sessions`

# Manual Test: Game Stats Recording

## Issue
Player stats not being updated when games complete after using Test Panel to set scores to 40-40.

## Test Steps

### 1. Start the Game
```bash
npm run dev
```

Open browser to http://localhost:5175

### 2. Create a Game
- Click "Quick Play (1 Player + 3 Bots)"
- Wait for team selection
- Click "Start Game"

### 3. Fast-Forward to Game Completion
- Click "⚙️ Debug" button (top-right)
- Click "🧪 Test Panel"
- Set Team 1 score: `40`
- Set Team 2 score: `40`
- Click "Apply Scores"
- Close Test Panel

### 4. Complete the Game
- Enable autoplay if needed (toggle Manual/Auto button)
- Play one more round (or let bots play)
- Game should end when one team reaches 41+ points

### 5. Verify Stats Were Recorded

**Backend Console Check:**
Look for these log messages in the backend console:
```
Game {gameId} marked as finished, Team X won
Updated game stats for {playerName}: WIN/LOSS, ELO +/-{change}
```

**Database Check (PostgreSQL):**
```sql
-- Check game_history
SELECT * FROM game_history WHERE is_finished = TRUE ORDER BY finished_at DESC LIMIT 5;

-- Check player_stats (should NOT be empty for human players)
SELECT player_name, games_played, games_won, elo_rating
FROM player_stats
WHERE is_bot = FALSE
ORDER BY updated_at DESC
LIMIT 10;

-- Check if YOUR specific game was recorded
SELECT * FROM game_history WHERE game_id = 'YOUR_GAME_ID';

-- Check if YOUR player stats exist
SELECT * FROM player_stats WHERE player_name = 'You';
```

**API Check:**
```bash
# Get player stats
curl http://localhost:3001/api/stats/You

# Get leaderboard
curl http://localhost:3001/api/leaderboard

# Get recent games
curl http://localhost:3001/api/games/recent
```

## Expected Results

### ✅ Success Criteria

1. **Backend Logs Show:**
   - `"Game {gameId} marked as finished, Team X won"`
   - `"Updated game stats for {playerName}: WIN/LOSS, ELO +/-{change}"`

2. **Database Contains:**
   - Record in `game_history` with `is_finished = TRUE`
   - Record in `player_stats` for the human player (name = "You")
   - `games_played` incremented by 1
   - `games_won` or `games_lost` incremented by 1
   - `elo_rating` changed from 1200 default

3. **API Returns:**
   - `/api/stats/You` returns player stats object
   - Stats show `games_played >= 1`

### ❌ Failure Indicators

1. **No Backend Logs:**
   - Missing "marked as finished" message
   - Missing "Updated game stats" message

2. **Empty Database:**
   - No record in `game_history` for your game
   - No record in `player_stats` for "You"
   - `games_played` still 0

3. **API Errors:**
   - `/api/stats/You` returns 404 or empty object
   - Player not found in leaderboard

## Known Issues

### Issue: player_stats Not Being Initialized

**Symptom:** `game_history` has records, but `player_stats` is empty

**Root Cause:** `updateGameStats()` was performing UPDATE without ensuring record exists

**Fix Applied:**
Added initialization query in `backend/src/db/index.ts:325-331`:
```typescript
// First, ensure player exists in player_stats
const ensurePlayer = `
  INSERT INTO player_stats (player_name, is_bot)
  VALUES ($1, FALSE)
  ON CONFLICT (player_name) DO NOTHING
`;
await query(ensurePlayer, [playerName]);
```

**Committed In:** Commit 3daae88 "fix: Ensure player_stats record exists before updating game stats"

### Issue: Race Condition During Round Completion

**Symptom:** "Not in scoring phase" error prevents next round from starting

**Root Cause:** Phase transition happened after 3-second trick display delay

**Fix Applied:**
Moved phase transition to happen immediately when round ends (commit 64460cc)

## Debugging Tips

### Enable Detailed Logging

Add console logs in `backend/src/index.ts` around line 1940-1994:

```typescript
// Check for game over
if (game.teamScores.team1 >= 41 || game.teamScores.team2 >= 41) {
  console.log('🏁 GAME OVER DETECTED:', {
    gameId,
    team1Score: game.teamScores.team1,
    team2Score: game.teamScores.team2,
    players: game.players.map(p => ({ name: p.name, isBot: p.isBot }))
  });

  // ... existing code

  for (const player of humanPlayers) {
    console.log('💾 Saving stats for player:', player.name, { won, currentElo, eloChange });

    await updateGameStats(/* ... */);

    console.log('✅ Stats saved successfully for:', player.name);
  }
}
```

### Check Database Connection

```bash
# From backend directory
npm run db:test
# or manually:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_stats WHERE is_bot = FALSE;"
```

### Monitor Real-Time

In one terminal:
```bash
# Watch backend logs
npm run dev | grep -E "marked as finished|Updated game stats"
```

In another terminal:
```bash
# Watch database changes
watch -n 2 'psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_stats WHERE is_bot = FALSE"'
```

## Test Scenarios

### Scenario 1: Quick Win (Test Panel)
1. Quick Play
2. Test Panel: Team 1 = 41, Team 2 = 30
3. Verify stats immediately

### Scenario 2: Close Game (Test Panel)
1. Quick Play
2. Test Panel: Team 1 = 40, Team 2 = 40
3. Play one more round
4. Verify stats when game ends

### Scenario 3: Natural Game (No Test Panel)
1. Quick Play
2. Enable autoplay
3. Let game play to completion naturally
4. Verify stats

## Automated Tests

### E2E Test (Playwright)
```bash
cd e2e
npx playwright test 22-game-completion-stats.spec.ts
```

**Note:** Test is currently failing due to Test Panel UI interaction issues. Manual testing recommended.

### Unit Tests (Vitest)
```bash
cd backend
npm test -- index.test.ts
```

**Note:** Some tests failing due to missing database functions (`createGame`). Core stat recording tests should pass.

## Related Files

- `backend/src/index.ts:1940-1994` - Game completion logic
- `backend/src/db/index.ts:320-396` - `updateGameStats()` function
- `backend/src/db/index.ts:242-308` - `updateRoundStats()` function
- `backend/src/db/schema.sql` - Database schema
- `e2e/tests/22-game-completion-stats.spec.ts` - E2E tests (WIP)
- `backend/src/db/index.test.ts` - Unit tests (partial)

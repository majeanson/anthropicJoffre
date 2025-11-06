# Reconnection Flow Documentation

**File**: `backend/src/socketHandlers/connection.ts`
**Complexity**: HIGH
**Critical Path**: User experience depends on this working correctly

---

## 📋 Overview

The reconnection system allows players who disconnect (internet issues, page refresh, etc.) to rejoin their game without losing progress. It uses **session tokens** stored in the browser to authenticate returning players.

---

## 🔑 Key Concepts

### Session Token
- **What**: Unique identifier for a player's game session
- **Storage**: Browser's `sessionStorage` + PostgreSQL database
- **Format**: Random 64-character hex string
- **Lifespan**: Until game ends or player explicitly leaves

### Socket ID Migration
- **Problem**: Socket IDs change when players reconnect
- **Solution**: Update all references from old socket ID → new socket ID
- **Scope**: Player object, bets, tricks, stats, timeouts, AFKwarnings

### Grace Period
- **Duration**: 2 minutes after disconnect
- **Purpose**: Give player time to reconnect without penalty
- **Behavior**: Game continues with autoplay for disconnected player

---

## 🔄 Reconnection Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLAYER DISCONNECTS                          │
│                                                                 │
│  Browser: Tab closed / Network issue / Page refresh            │
│  Server: 'disconnect' event fired                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                DISCONNECTION HANDLING                            │
│                                                                 │
│  1. Mark player.connectionStatus = 'disconnected'              │
│  2. Set player.disconnectedAt = timestamp                      │
│  3. Start 2-minute grace period countdown                      │
│  4. Emit 'player_disconnected' to all players                  │
│  5. Keep game running (autoplay for disconnected player)       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────────┐   ┌───────────────────────────┐
    │  SCENARIO A:          │   │  SCENARIO B:              │
    │  Player Returns       │   │  Grace Period Expires     │
    │  Within 2 Minutes     │   │  (No Reconnection)        │
    └──────────┬────────────┘   └────────────┬──────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────────────┐  ┌──────────────────────────┐
│  RECONNECTION ATTEMPT        │  │  PLAYER REPLACED BY BOT  │
│                              │  │                          │
│  1. Browser loads game       │  │  1. Convert to bot       │
│  2. Check sessionStorage     │  │  2. Bot continues game   │
│  3. Find session token       │  │  3. Emit 'replaced_by   │
│  4. Emit 'reconnect_to_game' │  │     _bot' event          │
│     { token }                │  │  4. Game continues       │
└──────────────┬───────────────┘  └──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                TOKEN VALIDATION (3-TIER)                        │
│                                                                 │
│  Step 1: Database Validation                                   │
│    ├─ Query: SELECT * FROM player_sessions WHERE token = $1    │
│    ├─ Success: Continue to Step 2                              │
│    └─ Failure: Try in-memory sessions (fallback)               │
│                                                                 │
│  Step 2: Game Existence Check                                  │
│    ├─ Load game from DB or memory                              │
│    ├─ Success: Continue to Step 3                              │
│    └─ Failure: Emit 'reconnection_failed' (game ended)         │
│                                                                 │
│  Step 3: Player Validation                                     │
│    ├─ Find player in game by name                              │
│    ├─ Check: Not isEmpty (player didn't leave voluntarily)     │
│    ├─ Check: Not isBot (can't reconnect as bot)                │
│    ├─ Success: Continue to Data Migration                      │
│    └─ Failure: Emit 'reconnection_failed' + cleanup session    │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATA MIGRATION (Critical!)                         │
│                                                                 │
│  Old Socket ID: abc123 (disconnected)                          │
│  New Socket ID: xyz789 (reconnected)                           │
│                                                                 │
│  Migration Steps:                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 1. Update Player Object                                  │ │
│  │    player.id = newSocketId                               │ │
│  │    player.connectionStatus = 'connected'                 │ │
│  │    player.disconnectedAt = undefined                     │ │
│  │    player.reconnectTimeLeft = undefined                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 2. Migrate Previous Trick                                │ │
│  │    game.previousTrick.trick[].playerId = newSocketId     │ │
│  │    game.previousTrick.winnerId = newSocketId             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 3. Migrate Current Bets                                  │ │
│  │    game.currentBets[].playerId = newSocketId             │ │
│  │    game.highestBet.playerId = newSocketId                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 4. Migrate ALL Other References (migratePlayerIdentity)  │ │
│  │    ├─ roundStats                                         │ │
│  │    ├─ currentTrick                                       │ │
│  │    ├─ currentRoundTricks                                 │ │
│  │    ├─ afkWarnings Map                                    │ │
│  │    ├─ playersReady                                       │ │
│  │    └─ rematchVotes                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 5. Update Timeouts                                       │ │
│  │    ├─ Clear countdown interval (oldSocketId)             │ │
│  │    ├─ Clear action timeout (oldSocketId)                 │ │
│  │    └─ Restart timeout if it's player's turn             │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              RECONNECTION SUCCESS                               │
│                                                                 │
│  1. socket.join(gameId)                                        │
│  2. Update session in database (new socketId, timestamp)       │
│  3. Cancel game deletion timeout (if exists)                   │
│  4. Emit 'reconnection_successful' to player                   │
│     └─ Includes: Full game state, player's hand, current phase│
│  5. Emit 'player_reconnected' to other players                 │
│     └─ Shows "[PlayerName] reconnected" toast                  │
│  6. Player seamlessly continues game                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Step-by-Step

### Phase 1: Disconnection Detection

**Triggered by**: `socket.on('disconnect')` event

```typescript
socket.on('disconnect', () => {
  // Find all games this player is in
  games.forEach((game) => {
    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

    // Mark as disconnected
    player.connectionStatus = 'disconnected';
    player.disconnectedAt = Date.now();

    // Start 2-minute countdown
    const disconnectTimeout = setTimeout(() => {
      replaceWithBot(player, game);
    }, 120000); // 2 minutes

    disconnectTimeouts.set(socket.id, disconnectTimeout);

    // Notify other players
    io.to(game.id).emit('player_disconnected', {
      playerId: player.id,
      playerName: player.name,
      waitingForReconnection: true,
      reconnectTimeLeft: 120
    });
  });
});
```

---

### Phase 2: Reconnection Request

**Triggered by**: `socket.emit('reconnect_to_game', { token })`

**Frontend Code** (in `App.tsx` or reconnection component):
```typescript
const handleRejoinGame = () => {
  const sessionData = sessionStorage.getItem('gameSession');
  if (!sessionData || !socket) return;

  try {
    const session: PlayerSession = JSON.parse(sessionData);
    socket.emit('reconnect_to_game', { token: session.token });
  } catch (e) {
    sessionStorage.removeItem('gameSession');
  }
};
```

---

### Phase 3: Token Validation

**Step 1**: Database Validation
```typescript
const session = await validateDBSession(token);
// SELECT * FROM player_sessions
// WHERE token = $1 AND expires_at > NOW()

if (!session) {
  // Fallback to in-memory (for non-persisted games)
  session = validateSessionToken(token);
}
```

**Step 2**: Game Existence
```typescript
const game = await getGame(session.gameId);
// 1. Check in-memory: games.get(gameId)
// 2. If not found: Load from DB (active_games table)
// 3. If still not found: Game doesn't exist anymore

if (!game) {
  socket.emit('reconnection_failed', {
    message: 'Game no longer exists'
  });
  return;
}
```

**Step 3**: Player Validation
```typescript
const player = game.players.find(p => p.name === session.playerName);

// Validation checks:
if (!player) return fail('Player not in game');
if (player.isEmpty) return fail('Empty seat - player left');
if (player.isBot) return fail('Cannot reconnect as bot');
if (game.phase === 'game_over') return fail('Game finished');
```

---

### Phase 4: Socket ID Migration

**Why Necessary**: Every WebSocket connection gets a new socket ID. All game state references must be updated.

**Data Structures Affected**:
1. **player.id** - Direct reference
2. **previousTrick** - Historical data
3. **currentBets** - Betting phase data
4. **roundStats** - Round statistics
5. **currentTrick** - Current trick in progress
6. **currentRoundTricks** - All tricks this round
7. **afkWarnings** - AFK tracking Map
8. **playersReady** - Ready status array
9. **rematchVotes** - Rematch voting Map
10. **activeTimeouts** - Action timeout tracking

**Migration Code**:
```typescript
const oldSocketId = player.id;
const newSocketId = socket.id;

// 1. Update player
player.id = newSocketId;
player.connectionStatus = 'connected';
player.disconnectedAt = undefined;

// 2. Migrate previousTrick
if (game.previousTrick) {
  game.previousTrick.trick.forEach(tc => {
    if (tc.playerId === oldSocketId) {
      tc.playerId = newSocketId;
    }
  });
  if (game.previousTrick.winnerId === oldSocketId) {
    game.previousTrick.winnerId = newSocketId;
  }
}

// 3. Migrate bets
game.currentBets.forEach(bet => {
  if (bet.playerId === oldSocketId) {
    bet.playerId = newSocketId;
  }
});

// 4. Migrate everything else (helper function)
migratePlayerIdentity({
  gameState: game,
  roundStats: roundStats.get(gameId),
  oldPlayerId: oldSocketId,
  newPlayerId: newSocketId,
  oldPlayerName: player.name,
  newPlayerName: player.name // Usually same
});
```

---

### Phase 5: Timeout Management

**Problem**: Player had an active timeout (their turn) when they disconnected

**Solution**: Clear old timeout, restart with new socket ID

```typescript
const oldTimeoutKey = `${gameId}-${oldSocketId}`;
const existingTimeout = activeTimeouts.get(oldTimeoutKey);

if (existingTimeout) {
  clearTimeout(existingTimeout);
  activeTimeouts.delete(oldTimeoutKey);

  // Restart if still their turn
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer && currentPlayer.id === newSocketId) {
    const phase = game.phase === 'betting' ? 'betting' : 'playing';
    startPlayerTimeout(gameId, newSocketId, phase);
  }
}
```

---

### Phase 6: Session Update

**Update database** with new socket ID and timestamp:
```typescript
await updateSessionActivity(token, newSocketId);

// SQL:
// UPDATE player_sessions
// SET player_id = $1, updated_at = NOW()
// WHERE token = $2
```

---

### Phase 7: Cleanup & Notification

```typescript
// Join game room
socket.join(gameId);

// Cancel deletion timeout
if (gameDeletionTimeouts.has(gameId)) {
  clearTimeout(gameDeletionTimeouts.get(gameId));
  gameDeletionTimeouts.delete(gameId);
}

// Notify player (success!)
socket.emit('reconnection_successful', {
  gameState: game,
  session: { token, playerName, gameId }
});

// Notify other players
io.to(gameId).emit('player_reconnected', {
  playerName: player.name,
  playerId: newSocketId,
  oldSocketId: oldSocketId
});
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Betting player not found" after reconnection

**Cause**: `game.highestBet.playerId` still had old socket ID

**Solution**: 3-tier fallback in `calculateRoundScoring()`:
1. Find by exact ID match
2. Find by matching bet data
3. Find by position fallback

**File**: `backend/src/game/state.ts:calculateRoundScoring()`

---

### Issue 2: Duplicate actions after reconnection

**Cause**: Two timeouts active (old + new)

**Solution**: Always clear old timeout before restarting
```typescript
activeTimeouts.delete(oldTimeoutKey);
```

---

### Issue 3: Reconnection fails silently

**Cause**: Session expired or game deleted

**Solution**: Always emit clear error messages
```typescript
socket.emit('reconnection_failed', {
  message: 'Human-readable error'
});
```

---

## 🧪 Testing Reconnection

### Manual Testing Steps

1. **Start game** with 4 players
2. **Disconnect player** (close tab or throttle network)
3. **Wait 10 seconds** (confirm grace period active)
4. **Reconnect player** (reopen tab)
5. **Verify**:
   - Player returns to same position
   - Game state is current
   - Can play cards/bet normally
   - No duplicate actions

### Edge Cases to Test

- [ ] Reconnect during betting phase
- [ ] Reconnect during playing phase
- [ ] Reconnect during scoring phase
- [ ] Reconnect after grace period (should fail)
- [ ] Reconnect to finished game (should fail)
- [ ] Multiple players disconnect/reconnect
- [ ] Reconnect while it's your turn
- [ ] Reconnect with invalid token

---

## 📊 Reconnection Metrics

**Success Rate**: Track in production
```typescript
reconnections_attempted: Counter
reconnections_successful: Counter
reconnections_failed: Counter
reconnection_latency: Histogram
```

**Failure Reasons** (for debugging):
- Invalid token
- Game not found
- Player not in game
- Empty seat
- Game finished
- Database error

---

## 🔒 Security Considerations

1. **Token Expiration**: Sessions expire after game ends
2. **Token Cleanup**: Deleted when player leaves or game finishes
3. **Validation**: Always validate token in database first
4. **Rate Limiting**: Prevent reconnection spam
5. **Session Hijacking**: Token is single-use per game (invalidated on voluntary leave)

---

## 🎯 Future Improvements

1. **Shorter grace period** for quick games (30s instead of 2min)
2. **Pause game** option during disconnection
3. **Reconnection UI** - show players who are reconnecting
4. **Analytics** - track reconnection success rate
5. **Optimistic reconnection** - reconnect before validation completes

---

## 📚 Related Files

- **Handler**: `backend/src/socketHandlers/connection.ts` (436 lines)
- **Migration Helper**: `backend/src/utils/playerMigrationHelpers.ts`
- **Game State**: `backend/src/game/state.ts` (3-tier fallback)
- **Database**: `backend/src/db/sessions.ts`
- **Frontend Hook**: `frontend/src/hooks/useSocketConnection.ts`

---

*Last Updated: 2025-11-06*
*Sprint 3 Refactoring Documentation*

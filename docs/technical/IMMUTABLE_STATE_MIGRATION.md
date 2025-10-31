# Immutable State Transition Migration Guide

**Last Updated:** 2025-10-31
**Status:** Available for gradual adoption

---

## Overview

This guide explains how to gradually migrate from mutable state operations to immutable state transitions using the `stateTransitions.ts` module.

**Benefits:**
- ✅ Better testability (pure functions)
- ✅ Easier debugging (time-travel possible)
- ✅ Clearer separation of logic and I/O
- ✅ Undo/redo functionality potential
- ✅ Reduced bugs from unexpected mutations

---

## Available Immutable Transitions

**Location:** `backend/src/game/stateTransitions.ts`

### Team Selection Phase
```typescript
selectTeam(game: GameState, playerId: string, teamId: 1 | 2): GameState
swapPosition(game: GameState, playerId: string, targetPlayerId: string): GameState
```

### Betting Phase
```typescript
placeBet(game: GameState, playerId: string, amount: number, withoutTrump: boolean, skipped?: boolean): GameState
```

### Playing Phase
```typescript
playCard(game: GameState, playerId: string, card: Card): GameState
resolveTrick(game: GameState): GameState
```

### Scoring Phase
```typescript
scoreRound(game: GameState): GameState
```

### Round Management
```typescript
startNewRound(game: GameState, newDeck: Card[]): GameState
```

### Player Management
```typescript
removePlayer(game: GameState, playerId: string): GameState
```

### Rematch System
```typescript
voteRematch(game: GameState, playerId: string): GameState
resetForRematch(game: GameState, newDeck: Card[]): GameState
```

---

## Migration Pattern

### Before: Mutable Approach
```typescript
socket.on('select_team', ({ gameId, teamId }) => {
  const game = games.get(gameId);
  if (!game) return;

  // Validate
  if (game.phase !== 'team_selection') {
    socket.emit('error', { message: 'Not in team selection phase' });
    return;
  }

  // Mutate game state directly
  const player = game.players.find(p => p.id === socket.id);
  if (player) {
    player.teamId = teamId; // ❌ Mutation
  }

  // I/O
  io.to(gameId).emit('game_updated', game);
});
```

### After: Immutable Approach
```typescript
import { selectTeam } from './game/stateTransitions';

socket.on('select_team', ({ gameId, teamId }) => {
  const game = games.get(gameId);
  if (!game) return;

  // Use pure function (throws on validation error)
  try {
    const newGame = selectTeam(game, socket.id, teamId); // ✅ Returns new state
    games.set(gameId, newGame); // Update reference

    // I/O
    io.to(gameId).emit('game_updated', newGame);
  } catch (error) {
    socket.emit('error', { message: error.message });
  }
});
```

---

## Key Differences

| Aspect | Mutable | Immutable |
|--------|---------|-----------|
| **State Changes** | Direct mutations | Pure functions return new state |
| **Validation** | Manual checks + early returns | Throws errors (try/catch) |
| **Testing** | Requires mocks/setup | Pure input → output |
| **Debugging** | State history lost | State snapshots preserved |
| **Side Effects** | Mixed with logic | Separated (I/O only at edges) |

---

## Migration Strategy

### Phase 1: Identify Candidates ✅
Handlers that are good candidates for migration:
- ✅ **`socket.on('select_team')`** - Already using `applyTeamSelection`
- ✅ **`socket.on('swap_position')`** - Already using `applyPositionSwap`
- ⚠️ **`socket.on('place_bet')`** - Complex betting rules, needs careful migration
- ⚠️ **`socket.on('play_card')`** - Already using `applyCardPlay`, but has stats tracking
- ⚠️ **`socket.on('player_ready')`** - Simple, good candidate
- ❌ **`startNewRound()`** - Heavy I/O (database, deck creation)
- ❌ **`resolveTrick()`** - Heavy I/O (stats, database)

### Phase 2: Migrate Low-Risk Handlers
**Priority:** Handlers with minimal I/O and simple logic

**Example: player_ready**
```typescript
// Current (Mutable)
socket.on('player_ready', ({ gameId }) => {
  const game = games.get(gameId);
  if (!game) return;

  if (!game.playersReady) {
    game.playersReady = []; // ❌ Mutation
  }

  const player = game.players.find(p => p.id === socket.id);
  if (player && !game.playersReady.includes(player.name)) {
    game.playersReady.push(player.name); // ❌ Mutation
  }

  io.to(gameId).emit('game_updated', game);
});

// Proposed (Immutable)
function markPlayerReady(game: GameState, playerId: string): GameState {
  if (game.phase !== 'scoring') {
    throw new Error('Not in scoring phase');
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  const playersReady = game.playersReady || [];
  if (playersReady.includes(player.name)) {
    return game; // Already ready, no change
  }

  return {
    ...game,
    playersReady: [...playersReady, player.name],
  };
}

socket.on('player_ready', ({ gameId }) => {
  const game = games.get(gameId);
  if (!game) return;

  try {
    const newGame = markPlayerReady(game, socket.id);
    games.set(gameId, newGame);
    io.to(gameId).emit('game_updated', newGame);
  } catch (error) {
    socket.emit('error', { message: error.message });
  }
});
```

### Phase 3: Document Hybrid Approach
For handlers with heavy I/O (like `resolveTrick`):

```typescript
function resolveTrick(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  // 1. Pure transformation (uses stateTransitions.resolveTrick)
  const newGame = stateTransitions.resolveTrick(game);
  games.set(gameId, newGame);

  // 2. Side effects (I/O)
  // - Track statistics
  // - Save to database
  // - Emit socket events
  // - Start timers

  const stats = roundStats.get(gameId);
  if (stats) {
    // ... stats tracking
  }

  emitGameUpdate(gameId, newGame);

  // ... more I/O
}
```

---

## Testing Benefits

### Before: Hard to Test
```typescript
test('select team', () => {
  const game = createMockGame();
  const socket = createMockSocket();

  // Need to mock socket, games Map, io object, etc.
  // Hard to isolate logic
});
```

### After: Easy to Test
```typescript
test('selectTeam - switches player team', () => {
  const game = createGameState({
    players: [
      { id: 'p1', teamId: 1, ... },
      { id: 'p2', teamId: 2, ... },
    ],
  });

  const newGame = selectTeam(game, 'p1', 2);

  expect(newGame.players[0].teamId).toBe(2);
  expect(game.players[0].teamId).toBe(1); // Original unchanged
});
```

---

## Guidelines

### DO ✅
- Use immutable transitions for pure state logic
- Separate I/O from state transformations
- Throw errors for validation (caught by error boundaries)
- Return new state objects (never mutate input)
- Add comprehensive unit tests for transitions

### DON'T ❌
- Mix I/O with state transitions
- Mutate input parameters
- Access globals (database, sockets) inside transitions
- Rush migration - do it incrementally
- Break existing functionality

---

## Current Status

**Immutable Transitions:** 100% complete for all phases
**Handler Adoption:** ~20% (applyTeamSelection, applyPositionSwap, applyCardPlay, applyBet, etc.)
**Recommendation:** Gradual migration over time, focus on new features first

---

## Future Enhancements

Once more handlers use immutable transitions:

1. **Time-Travel Debugging**
   ```typescript
   const gameHistory = [];
   gameHistory.push({ timestamp: Date.now(), state: newGame });
   // Can replay any point in time
   ```

2. **Undo/Redo for Testing**
   ```typescript
   const undoStack = [game1, game2, game3];
   const previousState = undoStack.pop();
   ```

3. **State Snapshots for Replays**
   ```typescript
   // Already partially implemented with roundHistory
   // Can be extended with full state snapshots
   ```

---

## Resources

- **Immutable Functions:** `backend/src/game/stateTransitions.ts`
- **Tests:** `backend/src/game/stateTransitions.test.ts` (11 tests)
- **Current Hybrid Helpers:** `backend/src/game/state.ts`
- **Socket Handlers:** `backend/src/index.ts`

---

**Migration is optional but recommended for new features!**

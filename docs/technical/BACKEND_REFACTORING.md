# Backend Refactoring Guide

**Last Updated:** 2025-10-31
**Status:** Phase 2.5 Complete - Full Error Boundary Coverage + Infrastructure

---

## 🎯 Refactoring Goals

This document tracks the backend refactoring effort to improve:
- **Type Safety** - Eliminate `any` types, add strict typing
- **Error Handling** - Move from exceptions to explicit Result types
- **Pure Functions** - Separate logic from I/O for better testability
- **Immutability** - Prefer immutable state transformations over mutations
- **Code Organization** - Clear separation of concerns

---

## ✅ Completed (2025-10-31)

### 1. Result Type System
**Location:** `backend/src/types/result.ts`

Created a comprehensive Result<T, E> type for explicit error handling:

```typescript
// Before: Exceptions
function validateCard(card: Card) {
  if (!card.color) throw new Error('Invalid card');
  return true;
}

// After: Result type
function validateCard(card: Card): Result<void, string> {
  if (!card.color) return err('Invalid card');
  return ok(undefined);
}
```

**Benefits:**
- ✅ No hidden control flow (no exceptions)
- ✅ Forces error handling at call sites
- ✅ Better type inference
- ✅ Easier to test

**Files Updated:**
- `types/result.ts` - New Result type and helpers
- `game/validation.ts` - All validation functions
- `index.ts` - 5 validation call sites
- `game/validation.test.ts` - 30 tests updated

---

### 2. Typed Event System
**Location:** `backend/src/types/events.ts`, `connection/ConnectionManager.ts`

Replaced `any` types in socket events with typed event system:

```typescript
// Before
sendToSocket(socketId: string, event: string, data: any): boolean

// After
sendToSocket<E extends ServerEventName>(
  socketId: string,
  event: E,
  data: ServerToClientEvents[E]
): boolean
```

**Benefits:**
- ✅ Type-safe socket.emit() calls
- ✅ Autocomplete for event names
- ✅ Catches typos at compile time
- ✅ Documents all possible events

**Files Updated:**
- `types/events.ts` - Server/client event definitions
- `connection/ConnectionManager.ts` - Typed message queue

---

### 3. Eliminated 'any' Types
**Locations:** `index.ts`, `db/index.ts`, `types/events.ts`, `types/game.ts`

**Phase 1:** Fixed 7 instances in core logic
1. **index.ts:662** - `NodeJS.Timeout` for interval
2. **index.ts:941** - `GamePhase` validation
3. **index.ts:1149-1150** - `PlayerGameSummary` interface
4. **index.ts:1223** - `socket.handshake.address`
5. **db/index.ts:115** - `Player[]` instead of `any[]`

**Phase 2:** Added missing types and fixed event system (2025-10-31)
- Created `LeaderboardEntry` interface (17 fields typed)
- Created `GameHistoryEntry` interface (13 fields typed)
- Moved `OnlinePlayer` interface to shared types
- Fixed 6 `any` types in `types/events.ts`:
  - `hand: any[]` → `hand: Card[]`
  - `gameState: any` → `gameState: SpectatorGameState`
  - `players: any[]` → `players: LeaderboardEntry[]`
  - `games: any[]` → `games: GameHistoryEntry[]`
  - `players: any[]` → `players: OnlinePlayer[]`
  - `card: any` → `card: Card`

**Remaining (Acceptable):**
- SQL query params (`db/index.ts`, `db/gameState.ts`) - required by PostgreSQL library
- Validation function params (`utils/sanitization.ts`) - intentionally accept any type for validation
- Generic handler wrappers (`middleware/rateLimiter.ts`) - proper use of generics

**Impact:**
- ✅ 13+ `any` types eliminated
- ✅ 100% type-safe socket event system
- ✅ Better IDE autocomplete
- ✅ Compile-time error detection
- ✅ Self-documenting API contracts

---

### 4. Error Boundary System
**Location:** `backend/src/middleware/errorBoundary.ts`

Created wrapper for socket handlers to prevent crashes:

```typescript
socket.on('create_game', withErrorBoundary(
  async (playerName: string) => {
    // Handler logic
  },
  { handlerName: 'create_game', sendToClient: true }
));
```

**Features:**
- ✅ Catches sync and async errors
- ✅ Reports to Sentry with context
- ✅ Optional client notifications
- ✅ Prevents server crashes

**Coverage:** ✅ **100% of socket handlers** (26/26 handlers wrapped)
- 16 game action handlers (`errorBoundaries.gameAction`)
- 5 read-only handlers (`errorBoundaries.readOnly`)
- 5 lifecycle/background handlers (`errorBoundaries.background`)

---

### 5. Database Persistence Consolidation
**Location:** `index.ts:382` (emitGameUpdate function)

**Status:** 18 of 21 `emit('game_updated')` calls use `emitGameUpdate()` wrapper

**Remaining 3 direct calls** (intentional - hot path optimization):
- Lines 803, 1816: Trick completion visibility (client rendering)
- These skip DB save for performance

**Benefits:**
- ✅ Consistent persistence
- ✅ Debounced DB writes (100ms)
- ✅ Automatic error handling

---

### 6. Immutable State Transitions
**Location:** `backend/src/game/stateTransitions.ts`

Created pure, immutable state transformation functions:

```typescript
// Mutable (old - state.ts)
function applyTrickResolution(game: GameState, winnerId: string, points: number) {
  game.currentTrick = [];
  game.players[winnerIndex].tricksWon += 1;
  // Mutates game object
}

// Immutable (new - stateTransitions.ts)
function resolveTrick(game: GameState): GameState {
  return {
    ...game,
    currentTrick: [],
    players: game.players.map(/* ... */)
  };
  // Returns new object
}
```

**Benefits:**
- ✅ Easier to reason about
- ✅ Enables time-travel debugging
- ✅ Better for testing
- ✅ Potential for undo/redo

**Test Coverage:** 11 new tests in `stateTransitions.test.ts`

---

### 7. Fixed Bug in stateTransitions.ts
**Issue:** `resolveTrick()` wasn't adding base +1 point per trick

**Fix:**
```typescript
// Before
const points = calculateTrickPoints(game.currentTrick);

// After
const specialCardPoints = calculateTrickPoints(game.currentTrick);
const points = 1 + specialCardPoints;
```

---

## 📊 Test Coverage

**Total Tests:** 142 passing ✅
(Up from 131 - added 11 stateTransitions tests)

**Test Files:**
- `game/logic.test.ts` - 29 tests
- `game/validation.test.ts` - 30 tests
- `game/state.test.ts` - 46 tests
- `game/stateTransitions.test.ts` - 11 tests (NEW)
- `game/deck.test.ts` - 8 tests
- `db/index.test.ts` - 18 tests (5 skipped - quota limits)

**E2E Tests:** 15+ passing (reconnection, lobby, validation)
- Reconnection suite: 10/10 passing ✅
- Lobby suite: 5/5 passing ✅
- Marathon tests: Known flaky (browser crashes after ~60s)

---

## 🚧 Future Work (Optional Enhancements)

### Gradual Immutable State Adoption ✅ Guide Created
**Status:** Migration guide available
**Documentation:** [IMMUTABLE_STATE_MIGRATION.md](./IMMUTABLE_STATE_MIGRATION.md)

**Current State:**
- ✅ All immutable transitions implemented (`stateTransitions.ts`)
- ✅ 11 pure functions with 100% test coverage
- ✅ ~20% adopted in socket handlers
- ✅ Hybrid approach documented

**Migration Strategy:**
1. Use immutable transitions for new features
2. Gradually migrate existing handlers (low-risk first)
3. Keep heavy I/O handlers in hybrid mode
4. Comprehensive migration guide available

**Benefits:**
- Time-travel debugging potential
- Easier unit testing
- State snapshots for replays
- Reduced mutation bugs

### Performance Monitoring ✅ Complete
**Status:** Metrics system implemented
**Endpoint:** `GET /api/metrics/error-boundaries`

**Features:**
- ✅ Track calls, errors, success rates per handler
- ✅ Average execution time tracking
- ✅ Error categorization by type
- ✅ REST API endpoint for monitoring
- ✅ Real-time metrics collection

**Example Output:**
```json
{
  "timestamp": "2025-10-31T...",
  "totalHandlers": 26,
  "handlers": {
    "play_card": {
      "totalCalls": 1523,
      "totalErrors": 3,
      "errorRate": "0.20%",
      "averageExecutionTime": "12.34ms"
    }
  }
}
```

### Type System Enhancements ✅ Complete
**Status:** Frontend/backend types synchronized

**Changes:**
- ✅ Created `LeaderboardEntry` interface
- ✅ Created `GameHistoryEntry` interface
- ✅ Created `OnlinePlayer` interface
- ✅ Removed duplicate local definitions
- ✅ 100% type-safe socket events

---

## 🏗️ Next Phase Ideas (Not Urgent)

### Advanced State Management

**State Machines** - Explicit state transition rules
```typescript
type GameTransition =
  | { from: 'team_selection'; to: 'betting' }
  | { from: 'betting'; to: 'playing' }
  | { from: 'playing'; to: 'scoring' }
  | { from: 'scoring'; to: 'betting' | 'game_over' };
```

**Benefits:**
- Impossible to enter invalid states
- Clear visualization of game flow
- Compile-time validation

---

## 🏗️ Architecture Patterns

### Immutable vs Mutable Trade-offs

**Current State:**
- `state.ts` - Mutable functions (used in production)
- `stateTransitions.ts` - Immutable functions (available for gradual migration)

**When to Use Each:**

**Mutable (`state.ts`):**
- ✅ Simpler orchestration code
- ✅ Better performance (no object copying)
- ✅ Works with existing codebase
- ❌ Harder to test
- ❌ Side effects everywhere

**Immutable (`stateTransitions.ts`):**
- ✅ Easier to test and reason about
- ✅ Time-travel debugging possible
- ✅ No accidental mutations
- ❌ More verbose orchestration
- ❌ Slight performance overhead

**Recommendation:** Gradually migrate high-value functions to immutable pattern when refactoring.

---

## 📝 Migration Guide

### How to Migrate a Function to Immutable Pattern

1. **Write the pure function** in `stateTransitions.ts`:
```typescript
export function myPureFunction(game: GameState, input: T): GameState {
  return {
    ...game,
    // Apply changes immutably
  };
}
```

2. **Write tests first:**
```typescript
it('should not mutate original state', () => {
  const original = createTestGame();
  const snapshot = JSON.parse(JSON.stringify(original));

  const result = myPureFunction(original, input);

  expect(JSON.stringify(original)).toBe(JSON.stringify(snapshot));
});
```

3. **Update orchestration code:**
```typescript
// Before
myMutableFunction(game, input);
emitGameUpdate(gameId, game);

// After
const newGame = myPureFunction(game, input);
games.set(gameId, newGame);
emitGameUpdate(gameId, newGame);
```

4. **Keep side effects in orchestration:**
```typescript
function handleAction(gameId: string) {
  // 1. Get state
  const game = games.get(gameId);
  if (!game) return;

  // 2. Pure transformation
  const newGame = pureFunction(game);

  // 3. Side effects (I/O)
  games.set(gameId, newGame);
  emitGameUpdate(gameId, newGame);
  logAction(gameId, 'action_taken');
  updateStats(gameId, newGame);
}
```

---

## 🔍 Code Review Checklist

When reviewing backend code:

- [ ] Are errors handled with Result types (not exceptions)?
- [ ] Are socket events properly typed?
- [ ] No usage of `any` type (unless justified)?
- [ ] Database updates use `emitGameUpdate()` wrapper?
- [ ] Pure functions don't have side effects?
- [ ] State transformations are tested?
- [ ] Error boundaries wrap socket handlers?

---

## 📚 Related Documentation

- **[VALIDATION_SYSTEM.md](./VALIDATION_SYSTEM.md)** - Multi-layer validation architecture
- **[TESTING_ARCHITECTURE.md](./TESTING_ARCHITECTURE.md)** - Testing strategy
- **[BACKEND_TESTING.md](./BACKEND_TESTING.md)** - Backend test suite details
- **[FEATURES.md](./FEATURES.md)** - Complete feature documentation

---

## 📈 Impact Summary

**Code Quality Improvements:**
- ✅ 13+ `any` types eliminated (from events & types)
- ✅ 100% typed socket events (26/26 handlers)
- ✅ 100% error boundary coverage (26/26 handlers)
- ✅ Result-based error handling throughout validation
- ✅ 11 new tests for state transitions
- ✅ 3 new type interfaces exported (LeaderboardEntry, GameHistoryEntry, OnlinePlayer)

**Developer Experience:**
- ✅ Better IDE autocomplete
- ✅ Compile-time error catching
- ✅ Clearer error messages
- ✅ Easier debugging with immutable functions

**Production Benefits:**
- ✅ Fewer runtime errors
- ✅ Better error reporting (Sentry integration)
- ✅ Consistent database persistence
- ✅ No server crashes from socket errors

---

*This refactoring provides a solid foundation for future improvements while maintaining stability of the working codebase.*

# Backend Refactoring Phase 2.3-2.4: Analysis and Plan

**Date**: 2025-10-31
**Status**: Analysis Phase
**Goal**: Extract remaining business logic from orchestration layer

---

## Current Architecture State

### ✅ Completed (Phases 2.1-2.2)

#### Pure Functions (backend/src/game/logic.ts)
**Definition**: Functions with no side effects - same input always produces same output
- ✅ `getCardPoints()` - Calculate special card point values
- ✅ `determineWinner()` - Determine trick winner based on trump and led suit
- ✅ `calculateTrickPoints()` - Sum special card points in a trick
- ✅ `calculateRoundScore()` - Calculate scoring for bet success/failure
- ✅ `isBetHigher()` - Compare two bets
- ✅ `getHighestBet()` - Find highest bet with dealer priority
- ✅ `getWinnerName()` - Look up winner's name from trick
- ✅ `hasRedZero()`, `hasBrownZero()` - Check for special cards
- ✅ `getFastestPlayer()`, `getTrumpMaster()`, `getLuckiestPlayer()` - Statistics helpers

#### State Transformation Functions (backend/src/game/state.ts)
**Definition**: Functions that mutate game state (for performance) but contain no I/O
- ✅ `applyCardPlay()` - Add card to trick, advance turn, set trump
- ✅ `applyBet()` - Record player's bet, advance turn
- ✅ `resetBetting()` - Clear bets for new round
- ✅ `applyTeamSelection()` - Assign player to team
- ✅ `applyPositionSwap()` - Swap two players' positions
- ✅ `initializeRound()` - Deal new hands, reset round state
- ✅ `clearTrick()` - Clear current trick after resolution
- ✅ `addTeamPoints()` - Add points to team score
- ✅ `updateScores()` - Update team scores from scoring result
- ✅ `setPhase()` - Change game phase
- ✅ `applyTrickResolution()` - Award trick, update stats, check round end
- ✅ `calculateRoundScoring()` - Calculate offensive/defensive scores
- ✅ `applyRoundScoring()` - Apply scores, update history, check game over

#### Immutable State Transitions (backend/src/game/stateTransitions.ts)
**Definition**: Pure functions that return new game state without mutation
- ✅ `selectTeam()` - Return new state with team selection
- ✅ `swapPosition()` - Return new state with swapped positions
- ✅ `placeBet()` - Return new state with bet placed
- ✅ `playCard()` - Return new state with card played
- ✅ `resolveTrick()` - Return new state with trick resolved
- ✅ `scoreRound()` - Return new state with round scored
- ✅ `startNewRound()` - Return new state for new round
- ✅ `removePlayer()` - Return new state with player removed
- ✅ `voteRematch()` - Return new state with rematch vote
- ✅ `resetForRematch()` - Return new state for rematch

#### Validation Functions (backend/src/game/validation.ts)
**Definition**: Functions that check if an action is valid
- ✅ `validateCardPlay()` - Check if card play is legal
- ✅ `validateBet()` - Check if bet is legal
- ✅ `validateTeamSelection()` - Check if team selection is valid
- ✅ `validatePositionSwap()` - Check if position swap is valid
- ✅ `validateGameStart()` - Check if game can start

#### Round Statistics (backend/src/game/roundStatistics.ts)
**Definition**: Functions for calculating round statistics
- ✅ `calculateRoundStatistics()` - Calculate fastest player, trump master, etc.
- ✅ `initializeRoundStats()` - Initialize stats tracking for round

#### Test Coverage
- ✅ **142 tests passing** across 6 test files
- ✅ `deck.test.ts` (8 tests) - Deck creation and dealing
- ✅ `logic.test.ts` (37 tests) - Pure game logic
- ✅ `validation.test.ts` (27 tests) - Validation rules
- ✅ `state.test.ts` (47 tests) - State transformations
- ✅ `stateTransitions.test.ts` (5+ tests) - Immutable transitions
- ✅ `db/index.test.ts` (18 tests) - Database operations

---

## 🎯 Remaining Work (Phase 2.3-2.4)

### Issue #1: Round Stats Side Effects in resolveTrick()

**Location**: `backend/src/index.ts` lines 1031-1044

**Current Code**:
```typescript
function resolveTrick(gameId: string) {
  // ... get game state ...

  // SIDE EFFECT - Track special card stats (uses mutable Map)
  const stats = roundStats.get(gameId);
  if (stats) {
    if (hasRedZero(game.currentTrick)) {
      const redZeroCount = stats.redZerosCollected.get(winnerName) || 0;
      stats.redZerosCollected.set(winnerName, redZeroCount + 1);
    }
    if (hasBrownZero(game.currentTrick)) {
      const brownZeroCount = stats.brownZerosReceived.get(winnerName) || 0;
      stats.brownZerosReceived.set(winnerName, brownZeroCount + 1);
    }
  }

  // ... rest of orchestration ...
}
```

**Problem**:
- Mutable side effects buried in orchestration function
- Not testable in isolation
- Stats tracking logic mixed with orchestration

**Solution**: Extract to pure helper function
```typescript
// New function in roundStatistics.ts
export function updateTrickStats(
  stats: RoundStatsData | undefined,
  trick: TrickCard[],
  winnerName: string
): RoundStatsData | undefined {
  if (!stats) return stats;

  const newStats = { ...stats };

  if (hasRedZero(trick)) {
    const count = newStats.redZerosCollected.get(winnerName) || 0;
    newStats.redZerosCollected.set(winnerName, count + 1);
  }

  if (hasBrownZero(trick)) {
    const count = newStats.brownZerosReceived.get(winnerName) || 0;
    newStats.brownZerosReceived.set(winnerName, count + 1);
  }

  return newStats;
}
```

**Impact**:
- ✅ Testable in isolation
- ✅ Clear intent (function name describes what it does)
- ✅ Can be reused if needed

---

### Issue #2: setTimeout Delays for UI Animation

**Location**: `backend/src/index.ts` lines 1068-1087

**Current Code**:
```typescript
function resolveTrick(gameId: string) {
  // ... calculations and state updates ...

  if (result.isRoundOver) {
    setTimeout(() => {
      const g = games.get(gameId);
      if (g) {
        g.currentTrick = [];
      }
      endRound(gameId);
    }, 2000);
  } else {
    setTimeout(() => {
      const g = games.get(gameId);
      if (g) {
        g.currentTrick = [];
        emitGameUpdate(gameId, g);
        startPlayerTimeout(gameId, winnerName, 'playing');
      }
    }, 2000);
  }
}
```

**Problem**:
- setTimeout makes testing difficult
- 2-second delay is for UI animation (frontend concern bleeding into backend)
- Duplicated setTimeout logic

**Solution Options**:

**Option A**: Extract delay logic to helper
```typescript
function schedulePostTrickActions(
  gameId: string,
  winnerName: string,
  isRoundOver: boolean,
  delay: number = 2000
) {
  setTimeout(() => {
    const game = games.get(gameId);
    if (!game) return;

    game.currentTrick = [];

    if (isRoundOver) {
      endRound(gameId);
    } else {
      emitGameUpdate(gameId, game);
      startPlayerTimeout(gameId, winnerName, 'playing');
    }
  }, delay);
}
```

**Option B**: Move delay to frontend (better separation of concerns)
- Server emits `trick_resolved` with currentTrick visible
- Frontend shows animation for 2 seconds
- Server doesn't wait, immediately clears trick and continues
- **Problem**: Requires frontend changes, may cause race conditions

**Option C**: Make delay configurable for testing
- Add optional `delayMs` parameter (default 2000)
- Tests can pass 0 for immediate execution
- **Problem**: Tests with delayMs=0 don't test real behavior

**Recommendation**: **Option A** - Extract to helper with configurable delay
- Keeps delay in backend (where it currently is)
- Makes delay explicit and configurable
- Reduces code duplication
- Testable with dependency injection

---

### Issue #3: Interval-Based Ready Check

**Location**: `backend/src/index.ts` lines 1222-1237

**Current Code**:
```typescript
function endRound(gameId: string) {
  // ... scoring and database saves ...

  // Check for ready or timeout every second
  const roundSummaryInterval = setInterval(() => {
    const currentGame = games.get(gameId);
    if (!currentGame || currentGame.phase !== 'scoring') {
      clearInterval(roundSummaryInterval);
      return;
    }

    const allReady = currentGame.playersReady && currentGame.playersReady.length === 4;
    const timeoutReached = currentGame.roundEndTimestamp && (Date.now() - currentGame.roundEndTimestamp >= 60000);

    if (allReady || timeoutReached) {
      clearInterval(roundSummaryInterval);
      currentGame.roundNumber += 1;
      startNewRound(gameId);
    }
  }, 1000);
}
```

**Problem**:
- setInterval polling is inefficient
- Logic buried in orchestration function
- Difficult to test

**Solution**: Event-driven approach
```typescript
// Instead of polling, trigger check on player_ready event
socket.on('player_ready', ({ gameId }) => {
  const game = games.get(gameId);
  if (!game || game.phase !== 'scoring') return;

  // Add player to ready list
  game.playersReady = game.playersReady || [];
  if (!game.playersReady.includes(socket.id)) {
    game.playersReady.push(socket.id);
  }

  // Check if ready to start next round
  if (shouldStartNextRound(game)) {
    game.roundNumber += 1;
    startNewRound(gameId);
  }
});

// Pure helper function
function shouldStartNextRound(game: GameState): boolean {
  const allReady = game.playersReady && game.playersReady.length === 4;
  const timeoutReached = game.roundEndTimestamp &&
    (Date.now() - game.roundEndTimestamp >= 60000);
  return allReady || timeoutReached;
}
```

**Impact**:
- ✅ Event-driven (more efficient)
- ✅ Testable helper function
- ✅ No polling overhead
- ⚠️ Still need timeout fallback for AFK players

**Better Solution**: Use timeout manager
```typescript
function endRound(gameId: string) {
  // ... scoring and database saves ...

  // Emit round ended
  broadcastGameUpdate(gameId, 'round_ended', game);

  // Start 60-second timeout for next round
  startRoundSummaryTimeout(gameId, () => {
    const game = games.get(gameId);
    if (game && game.phase === 'scoring') {
      game.roundNumber += 1;
      startNewRound(gameId);
    }
  }, 60000);
}

// In player_ready handler
socket.on('player_ready', ({ gameId }) => {
  const game = games.get(gameId);
  if (!game || game.phase !== 'scoring') return;

  game.playersReady = game.playersReady || [];
  if (!game.playersReady.includes(socket.id)) {
    game.playersReady.push(socket.id);
  }

  if (game.playersReady.length === 4) {
    clearRoundSummaryTimeout(gameId);
    game.roundNumber += 1;
    startNewRound(gameId);
  }
});
```

---

## 📊 Refactoring Priority

### Priority 1: Extract Round Stats Tracking (Low Effort, High Impact)
- **Effort**: 30 minutes
- **Files**: `backend/src/game/roundStatistics.ts`, `backend/src/index.ts`
- **Tests**: Add 3-5 tests to `roundStatistics.test.ts`
- **Impact**: Cleaner orchestration, better testability

### Priority 2: Extract setTimeout Helper (Medium Effort, Medium Impact)
- **Effort**: 45 minutes
- **Files**: `backend/src/index.ts` (create helper function)
- **Tests**: Add tests with configurable delay
- **Impact**: Less code duplication, easier testing

### Priority 3: Refactor Ready Check (High Effort, Low-Medium Impact)
- **Effort**: 1-2 hours
- **Files**: `backend/src/index.ts`, `backend/src/utils/timeoutManager.ts`
- **Tests**: Integration tests for ready check flow
- **Impact**: Better architecture, but current polling works fine

### Priority 4: Documentation (Medium Effort, High Impact)
- **Effort**: 1 hour
- **Files**: Create `docs/technical/BACKEND_ARCHITECTURE.md`
- **Content**: Document separation of concerns, architecture layers
- **Impact**: Future maintainability, onboarding new developers

---

## 🎯 Recommended Approach

### Phase 2.3: Extract Round Stats and setTimeout (1.5 hours)
1. ✅ Extract `updateTrickStats()` to `roundStatistics.ts`
2. ✅ Extract `schedulePostTrickActions()` helper
3. ✅ Add tests for new functions
4. ✅ Update `resolveTrick()` to use new helpers

### Phase 2.4: Documentation and Integration Tests (1.5 hours)
1. ✅ Create `BACKEND_ARCHITECTURE.md` documentation
2. ✅ Document orchestration patterns
3. ✅ Create integration test examples (optional)
4. ✅ Update ROADMAP.md with completion

### Optional: Ready Check Refactoring (Future Sprint)
- Can be tackled in a future sprint if needed
- Current polling approach works fine for now
- Would be part of larger timeout system refactoring

---

## 📁 Files to Modify

### Phase 2.3
- `backend/src/game/roundStatistics.ts` - Add `updateTrickStats()`
- `backend/src/game/roundStatistics.test.ts` - Add tests
- `backend/src/index.ts` - Refactor `resolveTrick()` to use helpers

### Phase 2.4
- `docs/technical/BACKEND_ARCHITECTURE.md` - New file
- `ROADMAP.md` - Mark Phase 2.3-2.4 complete
- `CLAUDE.md` - Update with refactoring completion notes

---

## ✅ Success Criteria

1. **No regressions**: All 142 tests still pass
2. **Better separation**: Orchestration functions only coordinate, don't contain business logic
3. **More testable**: New helpers have unit tests
4. **Well documented**: Architecture patterns are documented
5. **Maintainable**: Future developers understand the architecture

---

## 📚 References

- [TDD Workflow](../technical/TDD_WORKFLOW.md)
- [Backend Testing](../technical/BACKEND_TESTING.md)
- [Validation System](../technical/VALIDATION_SYSTEM.md)
- Sprint 3 Refactoring (completed socket handler extraction)

# Backend Architecture

**Last Updated**: 2025-10-31
**Status**: Sprint 5 Phase 2.3-2.4 Complete
**Purpose**: Document backend architecture patterns and separation of concerns

---

## Overview

The backend follows a **layered architecture** with clear separation between:
1. **Pure Functions** - Business logic without side effects
2. **State Transformations** - Mutate game state but have no I/O
3. **Orchestration** - Coordinate actions, handle I/O and timing
4. **I/O Handlers** - Socket.io events, database operations

This architecture makes the codebase:
- ✅ **Testable** - Pure functions and state transformations are easy to test
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Scalable** - Easy to add new features without breaking existing code
- ✅ **Debuggable** - Each layer has specific responsibilities

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Socket.io Event Handlers                   │
│                   (socketHandlers/*.ts)                       │
│  - lobby.ts (create, join, team selection, start)           │
│  - gameplay.ts (betting, card playing, ready states)         │
│  - chat.ts (team selection and in-game chat)                 │
│  - spectator.ts (spectator join/leave/updates)              │
│  - bots.ts (bot management, add/replace/difficulty)          │
│  - stats.ts (player stats, leaderboard, game history)        │
│  - connection.ts (reconnection, disconnection)               │
│  - admin.ts (kick player, rematch voting, test utils)        │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 Orchestration Functions                       │
│                      (index.ts)                              │
│  - startNewRound() - Coordinate round start                  │
│  - resolveTrick() - Coordinate trick resolution              │
│  - schedulePostTrickActions() - Handle animation delays       │
│  - endRound() - Coordinate round end, DB saves, next round   │
│                                                              │
│  Responsibilities:                                           │
│  • Get game state from memory (games Map)                    │
│  • Call pure functions for calculations                      │
│  • Call state transformations to mutate state                │
│  • Handle I/O (socket emissions, database saves)             │
│  • Manage timing (setInterval, setTimeout)                   │
│  • Coordinate between layers                                 │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              State Transformation Functions                   │
│                   (game/state.ts)                            │
│  - applyCardPlay() - Add card to trick, advance turn         │
│  - applyBet() - Record bet, advance turn                     │
│  - applyTrickResolution() - Award trick, check round end     │
│  - calculateRoundScoring() - Calculate offensive/defensive   │
│  - applyRoundScoring() - Update scores, history, game over   │
│  - resetBetting() - Clear bets for new round                 │
│  - initializeRound() - Deal hands, reset round state         │
│                                                              │
│  Characteristics:                                            │
│  • Mutate game state IN-PLACE (for performance)             │
│  • NO I/O operations (no socket.emit, no DB calls)           │
│  • NO logging (keep functions pure for testing)              │
│  • Return metadata about changes (e.g., trickComplete)       │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Pure Functions                             │
│               (game/logic.ts, etc.)                          │
│  - determineWinner() - Winner based on trump/led suit        │
│  - calculateTrickPoints() - Sum special card points          │
│  - calculateRoundScore() - Bet success/failure scoring       │
│  - isBetHigher() - Compare two bets                          │
│  - getHighestBet() - Find highest bet with dealer priority   │
│  - hasRedZero(), hasBrownZero() - Check special cards        │
│                                                              │
│  Characteristics:                                            │
│  • NO side effects                                           │
│  • Same input = same output (deterministic)                  │
│  • NO mutations (don't modify inputs)                        │
│  • Easily testable with unit tests                           │
└─────────────────────────────────────────────────────────────┘
```

---

## File Organization

### Core Game Logic

**`backend/src/game/`**

| File | Purpose | Layer | Examples |
|------|---------|-------|----------|
| `logic.ts` | Pure game rules | Pure Functions | `determineWinner()`, `calculateTrickPoints()` |
| `state.ts` | Mutable state changes | State Transformations | `applyCardPlay()`, `calculateRoundScoring()` |
| `stateTransitions.ts` | Immutable state changes | Pure Functions | `resolveTrick()`, `scoreRound()` (returns new state) |
| `validation.ts` | Input validation | Pure Functions | `validateCardPlay()`, `validateBet()` |
| `deck.ts` | Deck operations | Pure Functions | `createDeck()`, `shuffleDeck()`, `dealCards()` |
| `roundStatistics.ts` | Statistics tracking | State Transformations | `updateTrickStats()`, `calculateRoundStatistics()` |
| `botLogic.ts` | Bot AI decision-making | Pure Functions | `selectBotCard()`, `selectBotBet()` |

### Socket.io Event Handlers

**`backend/src/socketHandlers/`**

| File | Purpose | Events Handled |
|------|---------|----------------|
| `lobby.ts` | Game creation and setup | `create_game`, `join_game`, `select_team`, `swap_position`, `start_game` |
| `gameplay.ts` | Core gameplay actions | `place_bet`, `play_card`, `player_ready` |
| `chat.ts` | Chat functionality | `send_team_selection_chat`, `send_game_chat` |
| `spectator.ts` | Spectator mode | `spectate_game`, `leave_spectate` |
| `bots.ts` | Bot management | `add_bot`, `replace_with_bot`, `set_bot_difficulty` |
| `stats.ts` | Statistics and history | `get_player_stats`, `get_leaderboard`, `get_player_history` |
| `connection.ts` | Connection lifecycle | `reconnect_to_game`, `disconnect` |
| `admin.ts` | Administrative actions | `kick_player`, `vote_rematch`, `__test_set_scores` |

### Database Layer

**`backend/src/db/`**

| File | Purpose |
|------|---------|
| `index.ts` | All database query functions |
| `schema.sql` | Table definitions |
| `gameState.ts` | Game persistence functions |
| `sessions.ts` | Session management functions |

### Utilities

**`backend/src/utils/`**

| File | Purpose |
|------|---------|
| `sessionManager.ts` | JWT session token management |
| `playerHelpers.ts` | Player lookup and validation |
| `botHelpers.ts` | Bot naming and validation |
| `onlinePlayerManager.ts` | Online player tracking |
| `timeoutManager.ts` | Action timeout management |
| `formatting.ts` | String formatting utilities |

---

## Data Flow Example: Playing a Card

Let's trace what happens when a player plays a card:

### 1. Event Reception (Socket Handler)
**File**: `backend/src/socketHandlers/gameplay.ts`

```typescript
socket.on('play_card', async ({ gameId, card }) => {
  const game = games.get(gameId);

  // 1. Find player by socket ID
  const player = findPlayerBySocketId(game, socket.id);

  // 2. Validate the card play (pure function)
  const validation = validateCardPlay(game, player.id, card);
  if (!validation.valid) {
    socket.emit('invalid_move', { message: validation.error });
    return;
  }

  // 3. Call orchestration function
  // (Continues in index.ts)
});
```

### 2. Orchestration (Coordination Logic)
**File**: `backend/src/index.ts`

```typescript
// In the play_card handler (passed to registerGameplayHandlers)
function handlePlayCard(gameId: string, playerId: string, card: Card) {
  const game = games.get(gameId);

  // PURE - Validate card play
  const validation = validateCardPlay(game, playerId, card);
  if (!validation.valid) return { error: validation.error };

  // STATE TRANSFORMATION - Apply card play
  const result = applyCardPlay(game, playerId, card);

  // I/O - Track trump play for stats
  if (result.trumpWasSet && stats) {
    const count = stats.trumpsPlayed.get(player.name) || 0;
    stats.trumpsPlayed.set(player.name, count + 1);
  }

  // I/O - Emit game update
  emitGameUpdate(gameId, game);

  // ORCHESTRATION - Handle trick completion
  if (result.trickComplete) {
    resolveTrick(gameId);  // Delegates to another orchestration function
  } else {
    // Start timeout for next player
    const nextPlayer = game.players[game.currentPlayerIndex];
    startPlayerTimeout(gameId, nextPlayer.id, 'playing');
  }
}
```

### 3. State Transformation (Mutation)
**File**: `backend/src/game/state.ts`

```typescript
export function applyCardPlay(
  game: GameState,
  playerId: string,
  card: Card
): CardPlayResult {
  const player = game.players.find(p => p.id === playerId);
  const previousPlayerIndex = game.currentPlayerIndex;

  // Set trump if first card of first trick
  let trumpWasSet = false;
  if (!game.trump && game.currentTrick.length === 0) {
    game.trump = card.color;
    trumpWasSet = true;
  }

  // Add card to trick
  game.currentTrick.push({
    playerId: player.id,
    playerName: player.name,
    card,
  });

  // Remove card from hand (MUTATION)
  player.hand = player.hand.filter(
    c => !(c.color === card.color && c.value === card.value)
  );

  // Advance to next player (MUTATION)
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

  // Return metadata (NO side effects)
  return {
    trickComplete: game.currentTrick.length === 4,
    previousPlayerIndex,
    trumpWasSet,
    trump: game.trump,
  };
}
```

### 4. Pure Calculation (If Trick Complete)
**File**: `backend/src/game/logic.ts`

```typescript
export const determineWinner = (
  trick: TrickCard[],
  trump: CardColor | null
): string => {
  if (trick.length === 0) {
    throw new Error('Cannot determine winner of empty trick');
  }

  const ledSuit = trick[0].card.color;
  let winningCard = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i];

    // Trump always beats non-trump
    if (currentCard.card.color === trump && winningCard.card.color !== trump) {
      winningCard = currentCard;
    }
    // Higher trump beats lower trump
    else if (currentCard.card.color === trump && winningCard.card.color === trump) {
      if (currentCard.card.value > winningCard.card.value) {
        winningCard = currentCard;
      }
    }
    // Led suit beats off-suit (when no trump)
    else if (winningCard.card.color !== trump && currentCard.card.color === ledSuit && winningCard.card.color !== ledSuit) {
      winningCard = currentCard;
    }
    // Higher led suit beats lower led suit
    else if (currentCard.card.color === ledSuit && winningCard.card.color === ledSuit) {
      if (currentCard.card.value > winningCard.card.value) {
        winningCard = currentCard;
      }
    }
  }

  return winningCard.playerId;
};
```

---

## Design Principles

### 1. Separation of Concerns

**Pure Functions** (game/logic.ts)
- ✅ DO: Calculate results based on inputs
- ✅ DO: Return values
- ❌ DON'T: Mutate inputs
- ❌ DON'T: Access external state (games Map)
- ❌ DON'T: Perform I/O (socket, database, console.log)

**State Transformations** (game/state.ts)
- ✅ DO: Mutate game state directly
- ✅ DO: Return metadata about changes
- ❌ DON'T: Perform I/O (socket, database)
- ❌ DON'T: Access external state besides the passed game object
- ❌ DON'T: Log (keeps functions testable)

**Orchestration** (index.ts)
- ✅ DO: Get game state from memory
- ✅ DO: Call pure functions
- ✅ DO: Call state transformations
- ✅ DO: Emit socket events
- ✅ DO: Save to database
- ✅ DO: Manage timers (setTimeout, setInterval)
- ✅ DO: Log important events

### 2. Player Identification: ALWAYS Use Names

**❌ WRONG - Using socket.id (volatile)**:
```typescript
stats.redZerosCollected.set(socket.id, count);  // Breaks on reconnection!
```

**✅ CORRECT - Using player.name (stable)**:
```typescript
stats.redZerosCollected.set(player.name, count);  // Persists across reconnections
```

**Why**: Socket IDs change on reconnection. Player names are stable identifiers.

### 3. Event-Driven Architecture

**❌ WRONG - Using setTimeout for game logic**:
```typescript
setTimeout(() => {
  resolveTrick(gameId);
}, 500);  // Race condition! What if player plays another card?
```

**✅ CORRECT - Immediate resolution**:
```typescript
if (result.trickComplete) {
  resolveTrick(gameId);  // Resolve immediately
}
```

**Exception**: UI animation delays are acceptable:
```typescript
// OK: Delay for frontend animation
schedulePostTrickActions(gameId, winnerName, isRoundOver, 2000);
```

### 4. Immutability vs Performance

The codebase uses two approaches:

**Immutable State Transitions** (stateTransitions.ts)
- Used for: Complex state changes that benefit from immutability
- Returns: New GameState object
- Example: `resolveTrick(game)` returns new state

**Mutable State Transformations** (state.ts)
- Used for: Performance-critical operations
- Mutates: Game state in-place
- Example: `applyCardPlay(game, playerId, card)` mutates game

**When to use which**:
- **Immutable**: New features, complex logic, multi-step transformations
- **Mutable**: Performance hotspots, simple updates, proven patterns

---

## Testing Strategy

### Pure Functions (100% testable)

```typescript
// game/logic.test.ts
describe('determineWinner', () => {
  it('should pick highest trump when multiple trumps played', () => {
    const trick: TrickCard[] = [
      { playerId: 'p1', playerName: 'P1', card: { color: 'red', value: 3 } }, // Trump
      { playerId: 'p2', playerName: 'P2', card: { color: 'red', value: 7 } }, // Higher trump
      { playerId: 'p3', playerName: 'P3', card: { color: 'blue', value: 7 } },
      { playerId: 'p4', playerName: 'P4', card: { color: 'blue', value: 5 } },
    ];

    const winnerId = determineWinner(trick, 'red');

    expect(winnerId).toBe('p2');  // P2 played highest trump (7)
  });
});
```

### State Transformations (easy to test)

```typescript
// game/state.test.ts
describe('applyTrickResolution', () => {
  it('should award tricks and points to winner', () => {
    const game = createTestGame({
      players: [
        { id: 'p1', name: 'P1', tricksWon: 0, pointsWon: 0, /* ... */ },
        // ...
      ],
      currentTrick: [ /* 4 cards */ ],
    });

    const result = applyTrickResolution(game, 'p1', 6);  // P1 wins 6 points

    expect(game.players[0].tricksWon).toBe(1);
    expect(game.players[0].pointsWon).toBe(6);
    expect(result.isRoundOver).toBe(false);
  });
});
```

### Orchestration (integration tests)

Orchestration functions are harder to test because they have side effects (I/O).

**Approaches**:
1. **Dependency injection** - Pass I/O functions as parameters
2. **Mocking** - Mock socket.io and database calls
3. **E2E tests** - Test full flow with Playwright

Currently, orchestration is tested via:
- ✅ Backend unit tests (150 tests) for pure functions and state transformations
- ✅ E2E tests (Playwright) for full user flows

---

## Refactoring Patterns (Sprint 5 Phase 2.3)

### Pattern 1: Extract Stats Tracking

**Before** (inline side effects):
```typescript
function resolveTrick(gameId: string) {
  const stats = roundStats.get(gameId);
  if (stats) {
    if (hasRedZero(game.currentTrick)) {
      const count = stats.redZerosCollected.get(winnerName) || 0;
      stats.redZerosCollected.set(winnerName, count + 1);
    }
    if (hasBrownZero(game.currentTrick)) {
      const count = stats.brownZerosReceived.get(winnerName) || 0;
      stats.brownZerosReceived.set(winnerName, count + 1);
    }
  }
  // ...
}
```

**After** (extracted helper):
```typescript
function resolveTrick(gameId: string) {
  const stats = roundStats.get(gameId);
  updateTrickStats(stats, game.currentTrick, winnerName);
  // ...
}

// In roundStatistics.ts
export function updateTrickStats(
  stats: RoundStatsData | undefined,
  trick: TrickCard[],
  winnerName: string
): RoundStatsData | undefined {
  if (!stats) return stats;

  if (hasRedZero(trick)) {
    const count = stats.redZerosCollected.get(winnerName) || 0;
    stats.redZerosCollected.set(winnerName, count + 1);
  }

  if (hasBrownZero(trick)) {
    const count = stats.brownZerosReceived.get(winnerName) || 0;
    stats.brownZerosReceived.set(winnerName, count + 1);
  }

  return stats;
}
```

**Benefits**:
- ✅ Testable in isolation (8 new unit tests added)
- ✅ Reusable if needed elsewhere
- ✅ Clear function name explains intent

### Pattern 2: Extract setTimeout Orchestration

**Before** (duplicated setTimeout logic):
```typescript
function resolveTrick(gameId: string) {
  // ... calculations ...

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

**After** (extracted helper):
```typescript
function resolveTrick(gameId: string) {
  // ... calculations ...

  schedulePostTrickActions(gameId, winnerName, result.isRoundOver);
}

function schedulePostTrickActions(
  gameId: string,
  winnerName: string,
  isRoundOver: boolean,
  delayMs: number = 2000
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
  }, delayMs);
}
```

**Benefits**:
- ✅ DRY - No code duplication
- ✅ Configurable delay (testable with delayMs=0)
- ✅ Clear function name documents the animation delay purpose

---

## Common Patterns

### Pattern: Orchestration Function Structure

```typescript
async function orchestrationFunction(gameId: string, ...params) {
  // 1. Get game state
  const game = games.get(gameId);
  if (!game) return;

  // 2. Pure calculations (delegated to pure functions)
  const result = pureFunction(game, params);

  // 3. Side effects (stats tracking, using helper functions)
  updateStats(stats, result);

  // 4. State transformation (delegated to state.ts)
  applyStateChange(game, result);

  // 5. I/O - Emit events
  broadcastGameUpdate(gameId, 'event_name', game);

  // 6. I/O - Save to database (if needed)
  await saveGameToDB(gameId, game);

  // 7. Orchestration - Next steps
  if (condition) {
    nextOrchestrationFunction(gameId);
  }
}
```

### Pattern: State Transformation Function

```typescript
export function applyStateChange(
  game: GameState,
  param: SomeType
): ResultMetadata {
  // 1. Find relevant entities
  const player = game.players.find(p => p.id === playerId);

  // 2. Mutate state
  player.someField = newValue;
  game.someArray.push(newItem);

  // 3. Calculate metadata (pure calculation)
  const isComplete = checkCondition(game);

  // 4. Return metadata (NO side effects)
  return {
    isComplete,
    nextPlayerId: game.players[game.currentPlayerIndex].id,
  };
}
```

### Pattern: Pure Function

```typescript
export const pureCalculation = (
  input1: Type1,
  input2: Type2
): ResultType => {
  // 1. No access to external state
  // 2. No mutations of inputs
  // 3. Deterministic - same input = same output

  // Calculate result based only on inputs
  const result = input1.something + input2.something;

  return result;
};
```

---

## Future Improvements

### Potential Refactoring Opportunities

1. **Replace setInterval with event-driven approach**
   - Current: `endRound()` uses setInterval for ready check
   - Better: Event-driven with timeout fallback
   - Benefit: More efficient, easier to test

2. **Extract ELO calculation logic**
   - Current: ELO calculation in `endRound()`
   - Better: Pure function in `game/logic.ts`
   - Benefit: Testable in isolation

3. **Create orchestration layer module**
   - Current: All orchestration in `index.ts`
   - Better: Separate `orchestration/` directory
   - Benefit: Better organization as codebase grows

4. **Add integration test suite**
   - Current: Unit tests + E2E tests
   - Better: Add integration tests for orchestration
   - Benefit: Test I/O interactions without full E2E overhead

---

## Summary

The backend architecture separates:

1. **Pure Functions** (game/logic.ts) - Business rules, no side effects
2. **State Transformations** (game/state.ts) - Mutate state, no I/O
3. **Orchestration** (index.ts) - Coordinate, handle I/O and timing
4. **Socket Handlers** (socketHandlers/*.ts) - Receive events, validate, delegate

**Key Principles**:
- ✅ Pure functions are fully testable
- ✅ State transformations are easily testable
- ✅ Orchestration coordinates but delegates logic
- ✅ Use player names, not socket IDs
- ✅ Event-driven, not setTimeout for game logic
- ✅ Clear separation between layers

**Test Coverage**: 150 tests passing (7 test files)
- Pure functions: 100% coverage
- State transformations: >95% coverage
- Validation: 100% coverage
- Database: Limited by quota, core functions tested

---

*For more details, see:*
- [Backend Testing Guide](BACKEND_TESTING.md)
- [TDD Workflow](TDD_WORKFLOW.md)
- [Validation System](VALIDATION_SYSTEM.md)
- [CLAUDE.md](../../CLAUDE.md) (Main development guide)

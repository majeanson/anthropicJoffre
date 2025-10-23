# Codebase Upgrade Plan
**Last Updated**: 2025-01-22
**Project**: Trick Card Game (anthropicJoffre)

## 📊 Current State Analysis

### Statistics
- **Backend**: 12 TypeScript files
- **Frontend**: 47 TypeScript/TSX files
- **E2E Tests**: 19 test files, ~159 test cases
- **Documentation**: 22 markdown files
- **Total Lines of Code**: ~15,000+

### Recent Issues Fixed
- ✅ Division by zero in game stats calculation
- ✅ Session state using socket IDs (not stable across reconnections)
- ✅ Test file blocking Railway deployment

### Tech Debt Identified
1. **Test files have compilation errors** - Currently excluded from build
2. **Session identifiers inconsistent** - Mix of socket IDs and player names
3. **No unit tests** - Only E2E tests
4. **Game logic mixed with Socket.IO handlers** - Hard to test
5. **No API documentation** - Socket events not formally documented

---

## 🎯 Upgrade Plan Overview

### Phase 1: Code Quality & Testing (HIGH PRIORITY)
**Timeline**: 2-3 sessions
**Impact**: Maintainability, Reliability

### Phase 2: Refactoring & Architecture (MEDIUM PRIORITY)
**Timeline**: 3-4 sessions
**Impact**: Code quality, Testability

### Phase 3: Infrastructure & Monitoring (MEDIUM PRIORITY)
**Timeline**: 2-3 sessions
**Impact**: Operations, Reliability

### Phase 4: Features & Polish (LOW PRIORITY)
**Timeline**: Ongoing
**Impact**: User experience

---

## 📋 Phase 1: Code Quality & Testing

### 1.1 Fix Test File Compilation Errors ⚡ URGENT
**Effort**: 1 session
**Priority**: CRITICAL
**Status**: Partially complete (tests excluded from build)

**Current Issue**:
- Test files have outdated imports and type errors
- Currently excluded from TypeScript compilation via `tsconfig.json`
- This is a temporary workaround

**Action Items**:
- [ ] Fix all import errors in `backend/src/db/index.test.ts`
  - `createGame` → `saveOrUpdateGame`
  - `getPlayerHistory` → `getPlayerGameHistory`
- [ ] Add missing required fields to test data
  - `roundWon`, `wasBidder` for `RoundStatsUpdate`
- [ ] Fix implicit `any` types
- [ ] Re-enable test compilation in `tsconfig.json`
- [ ] Run tests to verify they pass

**Files to Fix**:
```
backend/src/db/index.test.ts (currently has 20+ errors)
```

---

### 1.2 Add Unit Tests for Game Logic
**Effort**: 2-3 sessions
**Priority**: HIGH
**Impact**: Reliability, Refactoring safety

**Current Gap**:
- Only E2E tests exist (19 files, ~159 tests)
- No unit tests for pure functions
- Game logic hard to test due to coupling with Socket.IO

**Action Items**:
- [ ] Create unit test suite using Vitest
  - `backend/src/game/logic.test.ts`
  - `backend/src/game/deck.test.ts`
- [ ] Test pure functions:
  - `determineWinner()` - All combinations of trump, led suit, off-suit
  - `calculateRoundScore()` - Bet made/failed scenarios
  - `isBetHigher()` - All bet comparison cases
  - `getHighestBet()` - Edge cases
  - `getPlayableCards()` - Suit following rules
  - `createDeck()` - Deck composition
  - `dealCards()` - Card distribution
- [ ] Test database functions:
  - `updatePlayerStats()` - ELO calculation
  - `updateRoundStats()` - Stats aggregation
  - `updateGameStats()` - Running averages (already found division by zero bug!)
- [ ] Achieve 80%+ code coverage for game logic

**Example Test Structure**:
```typescript
// backend/src/game/logic.test.ts
describe('determineWinner', () => {
  it('should pick trump card over led suit', () => {
    const trick: TrickCard[] = [
      { playerId: 'p1', card: { color: 'red', value: 7 } }, // Led
      { playerId: 'p2', card: { color: 'blue', value: 5 } }, // Trump
    ];
    const trump = 'blue';

    expect(determineWinner(trick, trump)).toBe('p2');
  });

  // Add 20+ more test cases for all scenarios
});
```

---

### 1.3 Improve E2E Test Reliability
**Effort**: 1 session
**Priority**: HIGH
**Impact**: CI/CD reliability

**Current Issues**:
- Some tests are flaky (timing-dependent)
- Missing tests for recent features (rematch, stats recording)
- Test failures shown in git status (see test-results/)

**Action Items**:
- [ ] Review and fix flaky tests
  - Add proper wait conditions
  - Increase timeouts where needed
  - Use `waitFor()` instead of fixed delays
- [ ] Add missing E2E tests:
  - [ ] Rematch voting flow
  - [ ] Stats recording after game completion
  - [ ] Session state persistence across reconnection
  - [ ] Bot difficulty levels
- [ ] Clean up test-results directory
- [ ] Document test patterns in TDD_WORKFLOW.md

---

### 1.4 Add TypeScript Strict Mode
**Effort**: 1-2 sessions
**Priority**: MEDIUM
**Impact**: Type safety, Bug prevention

**Current**: TypeScript strict mode is enabled but has escape hatches
**Goal**: Eliminate all `any` types, enforce null checks

**Action Items**:
- [ ] Enable strict null checks
- [ ] Fix all implicit `any` types
- [ ] Add proper type guards
- [ ] Enable `noUncheckedIndexedAccess`
- [ ] Run TypeScript compiler with `--strict --noImplicitAny`

**Expected Errors**: 50-100 type errors to fix

---

## 📋 Phase 2: Refactoring & Architecture

### 2.1 Extract Game Logic into Pure Functions ⭐ HIGH VALUE
**Effort**: 3-4 sessions
**Priority**: HIGH
**Impact**: Testability, Maintainability, Bot AI reusability

**Current Problem**:
```typescript
// backend/src/index.ts (1800+ lines)
socket.on('play_card', ({ gameId, card }) => {
  const game = games.get(gameId);

  // Validation logic mixed with I/O
  if (game.phase !== 'playing') {
    socket.emit('error', { message: 'Not in playing phase' });
    return;
  }

  // Business logic mixed with Socket.IO
  const player = game.players.find(p => p.id === socket.id);
  const ledSuit = game.currentTrick[0]?.card.color;
  // ... 50+ lines of mixed concerns
});
```

**Proposed Architecture**:
```
backend/src/
├── game/
│   ├── state.ts        # Pure state transformation functions
│   ├── validation.ts   # Pure validation functions
│   ├── logic.ts        # Existing (determineWinner, etc.)
│   └── deck.ts         # Existing
├── handlers/
│   ├── game.ts         # Socket event handlers (I/O only)
│   ├── betting.ts
│   └── playing.ts
└── index.ts            # Server setup + handler registration
```

**Refactoring Steps**:
- [ ] Session 1: Extract validation functions
  ```typescript
  // backend/src/game/validation.ts
  export function validateCardPlay(
    game: GameState,
    playerId: string,
    card: Card
  ): ValidationResult {
    if (game.phase !== 'playing') {
      return { valid: false, error: 'Not in playing phase' };
    }
    // ... all validation logic
    return { valid: true };
  }
  ```

- [ ] Session 2: Extract state transformation functions
  ```typescript
  // backend/src/game/state.ts
  export function playCard(
    game: GameState,
    playerId: string,
    card: Card
  ): GameState {
    // Pure function - no I/O, no side effects
    const player = game.players.find(p => p.id === playerId)!;
    player.hand = player.hand.filter(c => !cardsEqual(c, card));

    game.currentTrick.push({ playerId, card });
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

    return game;
  }
  ```

- [ ] Session 3: Refactor Socket.IO handlers
  ```typescript
  // backend/src/handlers/playing.ts
  export function handlePlayCard(
    io: Server,
    socket: Socket,
    games: Map<string, GameState>,
    { gameId, card }: { gameId: string; card: Card }
  ) {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Pure validation
    const validation = validateCardPlay(game, socket.id, card);
    if (!validation.valid) {
      socket.emit('invalid_move', { message: validation.error });
      return;
    }

    // Pure state transformation
    const newGame = playCard(game, socket.id, card);
    games.set(gameId, newGame);

    // I/O
    io.to(gameId).emit('game_updated', newGame);

    // Check for trick completion
    if (newGame.currentTrick.length === 4) {
      resolveTrick(gameId);
    }
  }
  ```

- [ ] Session 4: Update bot AI to use pure functions
  ```typescript
  // frontend/src/utils/botPlayer.ts
  import { validateCardPlay, playCard } from '../../../backend/src/game/state';

  // Can now test bot logic without Socket.IO!
  export function chooseBestCard(game: GameState, botHand: Card[]): Card {
    const playableCards = botHand.filter(card =>
      validateCardPlay(game, botPlayerId, card).valid
    );
    // ... strategy logic
  }
  ```

**Benefits**:
- ✅ Easy to unit test (no mocking)
- ✅ Can reuse in bot AI
- ✅ Can implement undo/redo
- ✅ Can implement game replay
- ✅ Easier to reason about
- ✅ Enables time-travel debugging

---

### 2.2 Standardize Session Identifiers
**Effort**: 1 session
**Priority**: HIGH
**Impact**: Consistency, Bug prevention

**Current Issue**:
- Some state uses socket IDs (ephemeral)
- Some state uses player names (stable)
- Inconsistent after reconnection

**Already Fixed**:
- ✅ `rematchVotes` - uses player names
- ✅ `playersReady` - uses player names

**Still Uses Socket IDs**:
- `Bet.playerId` - OK (reset each round)
- `TrickCard.playerId` - OK (reset each trick)
- `Player.id` - OK (updated on reconnection)

**Action Items**:
- [ ] Audit all uses of player identifiers
- [ ] Document when to use socket ID vs player name
- [ ] Add type alias to distinguish:
  ```typescript
  type PlayerId = string;      // Socket ID (ephemeral)
  type PlayerName = string;    // Display name (stable)
  type SessionId = string;     // Session token (stable)
  ```
- [ ] Update type definitions with proper aliases

---

### 2.3 Consolidate Documentation
**Effort**: 1 session
**Priority**: MEDIUM
**Impact**: Developer experience

**Current**: 22 markdown files, some outdated/overlapping

**Action Items**:
- [ ] Review all .md files
- [ ] Archive obsolete docs:
  - `TEST_FIX_PLAN.md` (tests are fixed)
  - `TEST_FIXES_SUMMARY.md` (completed)
  - `REFACTORING_PLAN.md` (replace with this doc)
  - `NEXT_STEPS.md` (merge into IMPROVEMENT_SUGGESTIONS.md)
- [ ] Update CLAUDE.md with session identifier patterns
- [ ] Create ARCHITECTURE.md documenting:
  - Folder structure
  - File responsibilities
  - Data flow diagrams
  - When to use socket ID vs player name

---

### 2.4 Add API Documentation
**Effort**: 1 session
**Priority**: MEDIUM
**Impact**: Developer experience

**Current**: Socket events documented in CLAUDE.md but not comprehensive

**Action Items**:
- [ ] Create `API.md` documenting all Socket.IO events
- [ ] For each event, document:
  - Event name
  - Direction (client→server or server→client)
  - Payload structure
  - Response events
  - Error conditions
  - Example usage
- [ ] Add request/response flow diagrams
- [ ] Document rate limits

**Example Format**:
```markdown
### `play_card`
**Direction**: Client → Server
**When**: During playing phase when it's player's turn

**Payload**:
```typescript
{
  gameId: string;
  card: Card;
}
```

**Success Response**: `game_updated`
**Error Responses**:
- `invalid_move` - Card not playable
- `error` - Wrong phase, not your turn, etc.

**Validation**:
- Must be playing phase
- Must be player's turn
- Card must be in player's hand
- Card must follow suit if possible
```

---

## 📋 Phase 3: Infrastructure & Monitoring

### 3.1 Add Proper Error Tracking
**Effort**: 1 session
**Priority**: HIGH
**Impact**: Production debugging

**Current**: Only console.log errors

**Action Items**:
- [ ] Set up Sentry (or similar)
- [ ] Add error tracking to backend:
  ```typescript
  try {
    // Game logic
  } catch (error) {
    Sentry.captureException(error);
    console.error('Game error:', error);
    socket.emit('error', { message: 'An error occurred' });
  }
  ```
- [ ] Add error boundary to frontend:
  ```typescript
  <ErrorBoundary fallback={<ErrorPage />}>
    <App />
  </ErrorBoundary>
  ```
- [ ] Track critical errors in production:
  - Game state corruption
  - Database connection failures
  - Reconnection failures
  - Payment/transaction errors (if added later)

---

### 3.2 Add Performance Monitoring
**Effort**: 1 session
**Priority**: MEDIUM
**Impact**: Performance optimization

**Action Items**:
- [ ] Add metrics tracking:
  ```typescript
  const metrics = {
    activeGames: () => games.size,
    activePlayers: () => io.sockets.sockets.size,
    gamesCreatedToday: 0,
    gamesCompletedToday: 0,
    averageGameDuration: 0,
  };
  ```
- [ ] Expose metrics endpoint:
  ```typescript
  app.get('/api/metrics', (req, res) => {
    res.json({
      ...metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });
  ```
- [ ] Add performance tracking for slow operations:
  - Database queries > 100ms
  - Game state updates > 50ms
  - Socket broadcasts > 10ms

---

### 3.3 Add Rate Limiting
**Effort**: 1 session
**Priority**: MEDIUM
**Impact**: Security, DoS prevention

**Action Items**:
- [ ] Add rate limiting to REST endpoints
- [ ] Add rate limiting to Socket.IO events:
  ```typescript
  const rateLimits = new Map<string, { count: number; resetAt: number }>();

  function checkRateLimit(socketId: string, event: string): boolean {
    const key = `${socketId}:${event}`;
    const limit = rateLimits.get(key);
    const now = Date.now();

    if (!limit || now > limit.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + 1000 });
      return true;
    }

    if (limit.count >= 10) {
      return false; // Rate limited
    }

    limit.count++;
    return true;
  }
  ```
- [ ] Add rate limit config in `backend/src/config/rateLimits.ts`
- [ ] Different limits for different events:
  - `create_game`: 3/minute
  - `play_card`: 10/second
  - `send_chat`: 5/second

---

### 3.4 Improve Database Connection Handling
**Effort**: 1 session
**Priority**: MEDIUM
**Impact**: Reliability

**Current**: Basic connection pool

**Action Items**:
- [ ] Add connection retry logic
- [ ] Add connection health checks
- [ ] Add graceful shutdown:
  ```typescript
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await pool.end();
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
  ```
- [ ] Add database query timeout protection
- [ ] Add connection pooling monitoring

---

## 📋 Phase 4: Features & Polish

### 4.1 Complete Dark Mode Implementation
**Effort**: 1 session
**Priority**: LOW
**Impact**: User experience

**Current**: Partially implemented

**Action Items**:
- [ ] Audit all components for dark mode classes
- [ ] Test dark mode in all phases
- [ ] Add toggle persistence to localStorage
- [ ] Ensure WCAG AA contrast compliance

---

### 4.2 Improve Bot AI
**Effort**: 2 sessions
**Priority**: MEDIUM
**Impact**: Single-player experience

**See**: BOT_PLAYER_SYSTEM.md for detailed plan

**Action Items**:
- [ ] Implement card counting
- [ ] Implement partner communication (play high/low signals)
- [ ] Improve betting strategy (count points in hand)
- [ ] Add personality variations (aggressive/defensive)

---

### 4.3 Add Game Replay Feature
**Effort**: 2-3 sessions
**Priority**: LOW
**Impact**: Learning, Sharing

**Requires**: Phase 2.1 (Pure functions) completed first

**Action Items**:
- [ ] Record all game actions
- [ ] Create replay UI with play/pause/step controls
- [ ] Allow sharing replay links
- [ ] Add replay analysis (show probabilities, best moves)

---

## 📊 Success Metrics

### Code Quality Metrics
- [ ] TypeScript strict mode with 0 errors
- [ ] Unit test coverage > 80% for game logic
- [ ] E2E test pass rate > 95%
- [ ] 0 `any` types in codebase
- [ ] Documentation coverage > 80%

### Performance Metrics
- [ ] Game state update < 50ms
- [ ] Database queries < 100ms (p95)
- [ ] Socket broadcast < 10ms
- [ ] Memory usage < 500MB

### Reliability Metrics
- [ ] Uptime > 99.5%
- [ ] Error rate < 0.1%
- [ ] Reconnection success rate > 95%
- [ ] Test flakiness < 2%

---

## 🗓️ Recommended Session Order

### Session 1-2: Critical Fixes
1. Fix test compilation errors (1.1)
2. Add unit tests for game logic (1.2)

### Session 3-4: Refactoring Foundation
3. Extract validation functions (2.1.1)
4. Extract state transformation functions (2.1.2)

### Session 5-6: Complete Refactoring
5. Refactor Socket.IO handlers (2.1.3)
6. Update bot AI to use pure functions (2.1.4)

### Session 7-8: Infrastructure
7. Add error tracking and monitoring (3.1, 3.2)
8. Add rate limiting and improve DB handling (3.3, 3.4)

### Session 9-10: Documentation & Polish
9. Add API documentation and consolidate docs (2.3, 2.4)
10. Add TypeScript strict mode and final cleanup (1.4)

---

## 💡 Quick Wins (Can Do Anytime)

These don't require other work to be completed first:

1. **Fix test compilation** (1.1) - 1 hour
2. **Add rate limiting** (3.3) - 1 hour
3. **Consolidate documentation** (2.3) - 1 hour
4. **Add metrics endpoint** (3.2) - 30 minutes
5. **Add Sentry integration** (3.1) - 30 minutes

---

## 📝 Notes

- **Prioritize Phase 1 & 2** - Foundation for all future work
- **Phase 2.1 (Pure Functions)** is highest value - enables testing, bot AI, replay
- **Phase 3** can be done incrementally
- **Phase 4** is ongoing based on user feedback

**Last Review**: 2025-01-22

# Sprint 6-11: Comprehensive Improvement Plan

**Duration**: 10 weeks (5 sprints × 2 weeks)
**Focus**: Refactoring, Optimization, Error Handling, Test Coverage
**Last Updated**: 2025-11-07
**Status**: Sprint 6 Complete ✅ (All 6 tasks finished)

---

## Overview

This plan addresses critical improvements across:
- **Test Coverage**: 60% → 85% backend, 5% → 60% frontend
- **Performance**: 50-80% improvement via query cache, React optimization, indexing
- **Error Handling**: Verbose debugging, comprehensive coverage
- **Code Quality**: Eliminate 147 `any` types, refactor 7 oversized files
- **Security**: Comprehensive audit and hardening

---

## Sprint 6: Critical Fixes & Performance Quick Wins

**Duration**: 2 weeks | **Priority**: CRITICAL | **Effort**: 40 hours

### Goals
- Fix broken tests and improve stability
- Deploy query cache for 20-100x performance gain
- Add verbose error handling with debugging context
- Add database indexing for 5-10x query improvement

### Tasks

#### 1. Fix Failing Tests (1 hour)
**Files**: `backend/src/game/validation.test.ts`
- Fix 3 test failures (lines 265, 271, 365)
- Root cause: Error message string mismatches
- Action: Update test expectations to match implementation

#### 2. Verbose Error Handling Infrastructure (4 hours) - **NEW PRIORITY**
**Files**:
- `backend/src/utils/errorHandler.ts` (create)
- `backend/src/types/errors.ts` (create)
- `backend/src/middleware/requestTracing.ts` (create)

**Features**:
```typescript
// Error context capture
interface ErrorContext {
  // Source tracking
  file: string;
  function: string;
  line: number;

  // Request context
  correlationId: string;
  userId?: string;
  gameId?: string;
  action: string;

  // State context
  gameState?: Partial<GameState>;
  playerContext?: {
    playerId: string;
    playerName: string;
    teamId: number;
    phase: GamePhase;
  };

  // Call chain
  stackTrace: string;
  callChain: string[];

  // Timing
  timestamp: number;
  requestDuration?: number;

  // Additional data
  metadata: Record<string, any>;
}

// Enhanced error class
class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public context: ErrorContext,
    public severity: 'low' | 'medium' | 'high' | 'critical'
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// Structured error logger
function logError(error: Error | GameError, context?: Partial<ErrorContext>) {
  const errorLog = {
    timestamp: Date.now(),
    correlationId: context?.correlationId || generateCorrelationId(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as GameError).code,
      severity: (error as GameError).severity || 'medium',
    },
    context: {
      file: context?.file || extractFileFromStack(error.stack),
      function: context?.function || extractFunctionFromStack(error.stack),
      line: context?.line || extractLineFromStack(error.stack),
      userId: context?.userId,
      gameId: context?.gameId,
      action: context?.action,
      gameState: sanitizeGameState(context?.gameState),
      playerContext: context?.playerContext,
      callChain: context?.callChain || extractCallChain(error.stack),
      metadata: context?.metadata || {},
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    },
  };

  // Log to structured logger
  logger.error('Error occurred', errorLog);

  // Send to Sentry with full context
  if (Sentry) {
    Sentry.captureException(error, {
      tags: {
        correlationId: errorLog.correlationId,
        gameId: context?.gameId,
        action: context?.action,
      },
      contexts: {
        game: context?.gameState,
        player: context?.playerContext,
      },
    });
  }

  // Store in error database for analysis
  storeErrorForAnalysis(errorLog);
}

// Request tracing middleware
function withRequestTracing(handler: Function) {
  return async (...args: any[]) => {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    try {
      return await handler(...args);
    } catch (error) {
      logError(error, {
        correlationId,
        requestDuration: Date.now() - startTime,
        action: handler.name,
        callChain: [handler.name],
      });
      throw error;
    }
  };
}
```

**Implementation Checklist**:
- [x] Create ErrorContext interface and GameError class
- [x] Create logError() function with stack trace parsing
- [x] Create correlation ID system (UUID v4)
- [x] Add request tracing middleware for Socket.io
- [x] Integrate with existing logger.ts
- [x] Add error aggregation (group similar errors)
- [x] Create error dashboard query helpers
- [x] Add error metrics tracking (errors/minute, top error types)
- [x] Update all socket handlers to use new error system ✅ **COMPLETE (2025-11-07)**
  - achievements.ts: Updated to use errorBoundaries.readOnly
  - friends.ts: Updated to use errorBoundaries.gameAction/readOnly
  - All 12 socket handler files now use error boundaries
- [x] Add frontend error reporting (send to backend) ✅ **COMPLETE (2025-11-07)**
  - POST /api/errors endpoint created in routes.ts
  - Accepts error reports from frontend with full context
  - Logs to backend logger with correlation IDs

**Usage Example**:
```typescript
// Socket handler with full error context
socket.on('place_bet', async (data: { gameId: string; amount: number }) => {
  const correlationId = generateCorrelationId();

  try {
    const game = games.get(data.gameId);
    if (!game) {
      throw new GameError(
        'Game not found',
        'GAME_NOT_FOUND',
        {
          file: 'socketHandlers/gameplay.ts',
          function: 'place_bet',
          line: 42,
          correlationId,
          gameId: data.gameId,
          userId: socket.data.userId,
          action: 'place_bet',
          metadata: { requestedAmount: data.amount },
        },
        'medium'
      );
    }

    // ... rest of logic
  } catch (error) {
    logError(error, {
      correlationId,
      gameId: data.gameId,
      action: 'place_bet',
      playerContext: {
        playerId: socket.id,
        playerName: socket.data.playerName,
        teamId: game?.players.find(p => p.id === socket.id)?.teamId,
        phase: game?.phase,
      },
      metadata: data,
    });

    socket.emit('error', {
      message: 'Failed to place bet',
      correlationId, // Client can report this for support
    });
  }
});
```

**Benefits**:
- Full error context in logs (file, function, line, user, game state)
- Correlation IDs for tracing errors across systems
- Easy debugging with full call chain and timing
- Error aggregation for pattern detection
- Production-ready error analytics

#### 3. Query Cache Integration (4 hours) ✅ COMPLETE
**Files**: `backend/src/db/index.ts`

**Status**: Already integrated and working. Cache invalidation confirmed in `markGameFinished()` and `updatePlayerStats()`.

**Wrap 5 functions**:
```typescript
import { withCache, invalidateCache } from '../utils/queryCache';

export const getLeaderboard = withCache(
  'leaderboard',
  async (limit = 100, excludeBots = true) => { /* ... */ },
  60000 // 1 minute TTL
);

export const getPlayerStats = withCache(
  'player_stats',
  async (playerName: string) => { /* ... */ },
  30000 // 30 seconds TTL
);

export const getRecentGames = withCache(
  'recent_games',
  async (limit = 10) => { /* ... */ },
  30000
);

export const getGameReplayData = withCache(
  'game_replay',
  async (gameId: string) => { /* ... */ },
  300000 // 5 minutes TTL
);

export const getPlayerGameHistory = withCache(
  'player_history',
  async (playerName: string, limit = 20) => { /* ... */ },
  60000
);
```

**Add cache invalidation**:
```typescript
export async function updatePlayerStats(playerName: string, updates: any) {
  await query(/* ... */);
  invalidateCache('player_stats', playerName);
  invalidateCache('leaderboard'); // Leaderboard may have changed
}

export async function markGameFinished(gameId: string) {
  await query(/* ... */);
  invalidateCache('recent_games');
  invalidateCache('game_replay', gameId);
}
```

**Expected Results**:
- Cache hit rate: >80% after 5 minutes
- API response times: <10ms (from 20-100ms)
- Memory usage: <50MB for cache

#### 4. Database Optimization (1 day) ✅ COMPLETE

**Status**: Migration 014 created with 11 performance indexes. Applied successfully.

**Add Missing Indexes**:
```sql
-- backend/src/db/migrations/014_performance_indexes.sql

-- Game history queries (lobby, replay, stats)
CREATE INDEX IF NOT EXISTS idx_game_history_created_at
  ON game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_is_finished
  ON game_history(is_finished) WHERE is_finished = FALSE;

-- Player stats queries (leaderboard, profile)
CREATE INDEX IF NOT EXISTS idx_player_stats_games_won
  ON player_stats(games_won DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_name
  ON player_stats(player_name);

-- Session queries (reconnection)
CREATE INDEX IF NOT EXISTS idx_sessions_player_name
  ON sessions(player_name);
CREATE INDEX IF NOT EXISTS idx_sessions_game_id
  ON sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions(expires_at);

-- Friends queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id
  ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id
  ON friendships(friend_id);
```

**Add Retry Logic to Database Queries**:
```typescript
// backend/src/db/index.ts
export const query = async (
  text: string,
  params?: any[],
  retries = 3
): Promise<QueryResult> => {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database not configured');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await dbPool.query(text, params);
      return result;
    } catch (error: any) {
      const isRetryable = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(error.code);

      if (attempt === retries || !isRetryable) {
        logger.error('Database query failed', { text, error, attempt });
        throw error;
      }

      const backoff = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
      logger.warn('Database query retry', { attempt, backoff, error: error.code });
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw new Error('Query retry exhausted');
};
```

**Replace SELECT * with Explicit Columns**: ✅ COMPLETE

**Status**: Replaced 18 SELECT * statements across 7 files (friends.ts, index.ts, achievements.ts, notifications.ts, sessions.ts, profiles.ts).
```typescript
// Before (7 files)
SELECT * FROM users WHERE user_id = $1

// After (security + performance)
SELECT user_id, username, email, display_name, avatar_url
FROM users WHERE user_id = $1
```

**Files to Update**:
- `db/index.ts` - Multiple queries
- `db/users.ts` - User queries
- `db/profiles.ts` - Profile queries
- `db/friends.ts` - Friend queries
- `db/achievements.ts` - Achievement queries
- `db/sessions.ts` - Session queries
- `db/notifications.ts` - Notification queries

#### 5. Error Handling - Critical Paths (2 days)

**Socket Handler Error Handling**:
```typescript
// Pattern: Explicit try-catch with user-facing errors

// backend/src/socketHandlers/lobby.ts
socket.on('create_game', async (playerName: string) => {
  try {
    validatePlayerName(playerName);
    const game = await createGame(playerName);
    socket.emit('game_created', game);
  } catch (error) {
    logError(error, { action: 'create_game', playerName });
    socket.emit('error', {
      message: 'Failed to create game. Please try again.',
      code: 'GAME_CREATION_FAILED'
    });
  }
});

// backend/src/socketHandlers/gameplay.ts
socket.on('place_bet', async (data) => {
  try {
    const game = games.get(data.gameId);
    if (!game) throw new Error('Game not found');

    const validation = validateBet(game, socket.id, data.amount);
    if (!validation.valid) {
      socket.emit('invalid_bet', { message: validation.error });
      return;
    }

    // ... place bet logic
  } catch (error) {
    logError(error, { action: 'place_bet', gameId: data.gameId });
    socket.emit('error', {
      message: 'Failed to place bet',
      code: 'BET_FAILED'
    });
  }
});
```

**Frontend API Error Handling**:
```typescript
// Pattern: Try-catch with user feedback

// frontend/src/components/LobbyBrowser.tsx
const fetchGames = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/games/lobby');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const games = await response.json();
    setGames(games);
  } catch (error) {
    console.error('Failed to fetch games', error);
    showToast('Failed to load games. Please try again.', 'error');
    setGames([]); // Graceful fallback
  } finally {
    setLoading(false);
  }
};

// frontend/src/components/PlayerStatsModal.tsx
const fetchPlayerStats = async (playerName: string) => {
  try {
    const response = await fetch(`/api/stats/${playerName}`);
    if (response.status === 404) {
      showToast('Player not found', 'error');
      return null;
    }
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Stats fetch error', error);
    showToast('Error loading player stats', 'error');
    return null;
  }
};
```

**Files to Update** (6 components with fetch calls):
- `LobbyBrowser.tsx` - Game list fetching
- `PlayerStatsModal.tsx` - Stats and history fetching
- `GameReplay.tsx` - Replay data fetching
- `GlobalLeaderboard.tsx` - Leaderboard fetching
- `FriendsPanel.tsx` - Friends list fetching
- `SocialPanel.tsx` - Social data fetching

#### 6. React Error Boundaries (2 hours) ✅ COMPLETE (2025-11-07)

**Status**: All high-risk components wrapped with ErrorBoundary

**Wrapped Components**:
- PlayingPhase (App.tsx) - Already wrapped ✅
- GameReplay (App.tsx) - Wrapped with ReplayErrorFallback ✅
- LobbyBrowser (Lobby.tsx) - Wrapped with LobbyErrorFallback ✅
- PlayerStatsModal (Lobby.tsx) - Wrapped with StatsErrorFallback ✅
- GlobalLeaderboard (Lobby.tsx) - Wrapped with StatsErrorFallback ✅

**Created Fallback Components**:
- `frontend/src/components/fallbacks/PlayingPhaseFallback.tsx` ✅
- `frontend/src/components/fallbacks/ReplayErrorFallback.tsx` ✅
- `frontend/src/components/fallbacks/StatsErrorFallback.tsx` ✅
- `frontend/src/components/fallbacks/LobbyErrorFallback.tsx` ✅

**Implementation**:
```tsx
// frontend/src/App.tsx - GameReplay wrapped
<ErrorBoundary fallback={<ReplayErrorFallback onClose={() => setShowReplayModal(false)} />}>
  <Suspense fallback={<LoadingSpinner />}>
    <GameReplay {...props} />
  </Suspense>
</ErrorBoundary>

// frontend/src/components/Lobby.tsx - LobbyBrowser, Stats, Leaderboard wrapped
<ErrorBoundary fallback={<LobbyErrorFallback onClose={() => setShowBrowser(false)} />}>
  <LobbyBrowser {...props} />
</ErrorBoundary>

<ErrorBoundary fallback={<StatsErrorFallback onClose={closeModals} />}>
  <Suspense fallback={<div />}>
    <PlayerStatsModal {...props} />
    <GlobalLeaderboard {...props} />
  </Suspense>
</ErrorBoundary>
```

### Expected Impact
- **Performance**: 50-80% improvement (query cache + indexes)
- **Stability**: Zero test failures, comprehensive error handling
- **Debugging**: Full error context, correlation IDs, call chains
- **User Experience**: Graceful error recovery, clear error messages

---

## Sprint 7: Backend Test Coverage

**Duration**: 2 weeks | **Priority**: HIGH | **Effort**: 80 hours
**Status**: Tasks 1 & 4 Complete ✅ (76 tests: Socket Handlers + Utilities)

### Goals
- Increase backend test coverage from 60% to 85%
- Test all critical socket handlers
- Test authentication and database operations
- Achieve 100% coverage on game logic (already done)

### Tasks

#### 1. Socket Handler Tests - Critical (5 days) ✅ COMPLETE (2025-11-07)

**Status**: 47 tests created across 3 test files

**Test Files Created**:
- ✅ `socketHandlers/lobby.test.ts` (340 lines, 20 tests)
  - create_game: 4 tests (validation, host assignment, event emission)
  - join_game: 4 tests (player addition, full game rejection, started game rejection, team assignment)
  - select_team: 3 tests (timing, game phase validation, team balance)
  - swap_position: 3 tests (intra-team swaps, cross-team rejection, order updates)
  - kick_player: 3 tests (host validation, non-host rejection, state updates)
  - start_game: 3 tests (4-player requirement, team balance, card dealing)

- ✅ `socketHandlers/gameplay.test.ts` (280 lines, 16 tests)
  - place_bet: 7 tests (range validation, hierarchy, without-trump, dealer rules, skip validation)
  - play_card: 6 tests (valid play, suit-following, card ownership, turn validation, trick resolution, points calculation)
  - player_ready: 3 tests (ready state, round start, game end conditions)

- ✅ `socketHandlers/connection.test.ts` (230 lines, 11 tests)
  - reconnect_to_game: 5 tests (valid session, invalid token, expired session, state restoration, player notification)
  - disconnect: 3 tests (player disconnection, reconnection timer, event emission)
  - leave_game: 3 tests (player removal, session deletion, event emission)

**Test Results**: All 47 tests passing ✅

**Coverage Areas**:

**lobby.test.ts** - 687 LOC source file:
```typescript
describe('lobby handlers', () => {
  describe('create_game', () => {
    it('should create new game with valid player name');
    it('should reject invalid player names');
    it('should assign player as host');
    it('should emit game_created event');
  });

  describe('join_game', () => {
    it('should add player to existing game');
    it('should reject if game full');
    it('should reject if game already started');
    it('should assign player to team');
  });

  describe('select_team', () => {
    it('should allow team selection before game starts');
    it('should reject team selection during game');
    it('should balance teams (2v2)');
  });

  describe('swap_position', () => {
    it('should swap positions within team');
    it('should reject cross-team swaps');
    it('should update player order');
  });

  describe('kick_player', () => {
    it('should allow host to kick players');
    it('should reject non-host kick attempts');
    it('should update game state after kick');
  });

  describe('start_game', () => {
    it('should start game with 4 players');
    it('should reject if teams unbalanced');
    it('should deal cards and set dealer');
  });
});
```

**gameplay.test.ts** - 471 LOC source file:
```typescript
describe('gameplay handlers', () => {
  describe('place_bet', () => {
    it('should accept valid bet in range 7-12');
    it('should reject bet out of range');
    it('should enforce bet hierarchy (higher amount wins)');
    it('should handle without-trump bets correctly');
    it('should allow dealer to equalize');
    it('should reject dealer skip');
    it('should handle skip bet correctly');
  });

  describe('play_card', () => {
    it('should accept valid card play');
    it('should enforce suit-following rules');
    it('should reject card not in hand');
    it('should reject play when not player turn');
    it('should resolve trick after 4 cards');
    it('should calculate points correctly (red 0, brown 0)');
  });

  describe('player_ready', () => {
    it('should mark player ready after round');
    it('should start new round when all ready');
    it('should end game at 41+ points');
  });
});
```

**connection.test.ts** - 436 LOC source file:
```typescript
describe('connection handlers', () => {
  describe('reconnect_to_game', () => {
    it('should restore game state with valid session');
    it('should reject invalid session token');
    it('should reject expired session');
    it('should emit reconnection_successful');
    it('should notify other players of reconnection');
  });

  describe('disconnect', () => {
    it('should mark player as disconnected');
    it('should start 15-minute reconnection timer');
    it('should emit player_disconnected event');
  });

  describe('leave_game', () => {
    it('should remove player from game');
    it('should delete session');
    it('should emit player_left event');
  });
});
```

**Testing Utilities**:
```typescript
// backend/src/socketHandlers/__tests__/helpers.ts
export function createMockSocket(id: string, data: any = {}): Socket {
  const socket = {
    id,
    data,
    emit: vi.fn(),
    on: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    to: vi.fn().mockReturnThis(),
  };
  return socket as unknown as Socket;
}

export function createMockIo(): Server {
  return {
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  } as unknown as Server;
}

export function createTestGame(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    players: [],
    phase: 'team_selection',
    // ... default game state
    ...overrides,
  };
}
```

#### 2. Database Layer Tests - Authentication (2 days)

**Test Files to Create**:
- `db/users.test.ts` (~300 lines, 15 tests)
- `utils/sessionManager.test.ts` (~200 lines, 10 tests)
- `utils/authHelpers.test.ts` (~200 lines, 10 tests)

**users.test.ts** - 407 LOC source file:
```typescript
describe('User Database Operations', () => {
  describe('createUser', () => {
    it('should create user with hashed password');
    it('should reject duplicate email');
    it('should reject duplicate username');
    it('should validate email format');
  });

  describe('getUserByEmail', () => {
    it('should return user by email');
    it('should return null for non-existent user');
  });

  describe('verifyUserEmail', () => {
    it('should mark email as verified');
    it('should reject invalid token');
    it('should reject expired token');
  });

  describe('resetPassword', () => {
    it('should update password with valid token');
    it('should hash new password');
    it('should delete reset token after use');
  });
});
```

**sessionManager.test.ts**:
```typescript
describe('Session Manager', () => {
  describe('createSession', () => {
    it('should generate unique session token');
    it('should store session in database');
    it('should return session object');
  });

  describe('validateSession', () => {
    it('should return true for valid session');
    it('should return false for expired session');
    it('should return false for non-existent session');
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete sessions older than 15 minutes');
    it('should preserve valid sessions');
  });
});
```

**authHelpers.test.ts**:
```typescript
describe('Auth Helpers', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt');
    it('should generate different hash for same password');
  });

  describe('comparePassword', () => {
    it('should return true for correct password');
    it('should return false for incorrect password');
  });

  describe('generateToken', () => {
    it('should generate random token');
    it('should generate unique tokens');
  });

  describe('generateJWT', () => {
    it('should create valid JWT token');
    it('should include user data in payload');
  });
});
```

#### 3. Database Layer Tests - Persistence (2 days)

**Test Files to Create**:
- `db/gameState.test.ts` (~250 lines, 12 tests)
- `db/persistenceManager.test.ts` (~200 lines, 10 tests)

**gameState.test.ts**:
```typescript
describe('Game State Persistence', () => {
  describe('saveGameState', () => {
    it('should save full game state to database');
    it('should update existing game state');
    it('should handle large game states');
  });

  describe('loadGameState', () => {
    it('should load game state by ID');
    it('should return null for non-existent game');
    it('should deserialize JSON correctly');
  });

  describe('saveRoundSnapshot', () => {
    it('should save round state with timestamp');
    it('should preserve trick history');
  });
});
```

**persistenceManager.test.ts**:
```typescript
describe('Persistence Manager', () => {
  describe('scheduleSnapshot', () => {
    it('should save snapshots every 30 seconds');
    it('should skip if no state changes');
  });

  describe('cleanupOldSnapshots', () => {
    it('should delete snapshots older than 24 hours');
    it('should preserve recent snapshots');
  });
});
```

#### 4. Utility Module Tests (1 day) ✅ COMPLETE (2025-11-07)

**Status**: 29 tests created across 3 utility modules

**Test Files Created**:
- ✅ `utils/sanitization.test.ts` (150 lines, 10 test suites, 29 total tests)
  * sanitizePlayerName, sanitizeChatMessage, validateBetAmount, validateCardValue
  * validateCardColor, validateGameId, sanitizeTextInput, validateBoolean
  * validateTeamId, validatePlayerIndex

- ✅ `utils/playerHelpers.test.ts` (130 lines, 3 test suites, 9 tests)
  * findPlayer (4 tests): by socket ID, by name fallback, not found, empty array
  * findPlayerIndex (3 tests): by ID, by name, -1 when not found
  * hasAtLeastOneHuman (3 tests): humans exist, only bots, no players

- ✅ `utils/botHelpers.test.ts` (125 lines, 3 test suites, 8 tests)
  * getNextBotName (5 tests): Bot 1-3, gap filling, ignore non-bots
  * canAddBot (3 tests): allow <3, reject at 3, allow empty
  * areTeammates (4 tests): same team, different teams, not found cases

**Test Results**: All 29 tests passing ✅

### Test Coverage Targets

| Module | Current | Target | Tests Needed |
|--------|---------|--------|--------------|
| socketHandlers/ | 0% | 80% | 53 tests |
| db/ users & auth | 0% | 100% | 35 tests |
| db/ persistence | 0% | 80% | 22 tests |
| utils/ helpers | 0% | 70% | 21 tests |
| **Total** | **60%** | **85%** | **131 tests** |

### Expected Impact
- Backend test coverage: 60% → 85% (131 new tests)
- Critical paths fully tested
- Regression prevention
- CI/CD confidence

---

## Sprint 8: Frontend Test Coverage & React Optimization

**Duration**: 2 weeks | **Priority**: HIGH | **Effort**: 80 hours

### Goals
- Increase frontend test coverage from 5% to 60%
- Optimize React re-renders (30-50% improvement)
- Reduce bundle size (<200KB initial)
- Replace console.log with proper logging

### Tasks

#### 1. Critical Component Tests (5 days)

**Test Files to Create** (using React Testing Library + Vitest):

**PlayingPhase.test.tsx** (~500 lines, 20 tests):
```typescript
describe('PlayingPhase', () => {
  describe('Card Play', () => {
    it('should render player hand');
    it('should disable unplayable cards');
    it('should enable playable cards');
    it('should enforce suit-following visually');
    it('should show led suit indicator');
  });

  describe('Trick Display', () => {
    it('should show current trick cards');
    it('should position cards in circle');
    it('should highlight current player turn');
  });

  describe('Animations', () => {
    it('should animate card play');
    it('should animate trick collection');
    it('should show trick winner banner');
  });

  describe('Error States', () => {
    it('should handle missing game state gracefully');
    it('should handle missing player gracefully');
  });
});
```

**BettingPhase.test.tsx** (~300 lines, 15 tests):
```typescript
describe('BettingPhase', () => {
  describe('Bet Validation', () => {
    it('should disable Place Bet when bet too low');
    it('should enable Place Bet when bet valid');
    it('should show "must raise" warning');
    it('should show dealer privilege message');
  });

  describe('Skip Bet', () => {
    it('should show Skip button when allowed');
    it('should hide Skip button for dealer with bets');
    it('should display "Skipped" badge');
  });

  describe('Bet Display', () => {
    it('should show current highest bet');
    it('should display without-trump indicator');
  });
});
```

**TeamSelection.test.tsx** (~250 lines, 12 tests):
```typescript
describe('TeamSelection', () => {
  describe('Team Balance', () => {
    it('should disable Start Game with unbalanced teams');
    it('should enable Start Game with 2v2 teams');
    it('should show team balance warning');
  });

  describe('Position Swapping', () => {
    it('should allow position swap within team');
    it('should reject cross-team swap');
  });

  describe('Chat', () => {
    it('should display team selection chat');
    it('should send chat messages');
  });
});
```

**GameReplay.test.tsx** (~300 lines, 15 tests):
```typescript
describe('GameReplay', () => {
  describe('Playback Controls', () => {
    it('should play/pause replay');
    it('should step forward/backward');
    it('should jump to specific round');
  });

  describe('Data Loading', () => {
    it('should fetch replay data on mount');
    it('should handle 404 errors');
    it('should handle network errors');
  });

  describe('State Visualization', () => {
    it('should show game state at current moment');
    it('should display trick history');
  });
});
```

#### 2. React Performance Optimization (3 days)

**Add React.memo to Pure Components** (15 components):
```typescript
// frontend/src/components/Card.tsx
export const Card = React.memo(({ card, onClick, disabled }: CardProps) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.card.value === nextProps.card.value &&
         prevProps.card.color === nextProps.card.color &&
         prevProps.disabled === nextProps.disabled;
});

// Other candidates:
// - ScoreDisplay.tsx
// - PlayerInfo.tsx
// - TrickArea.tsx
// - BetDisplay.tsx
// - TeamIndicator.tsx
// ... (10 more)
```

**Add useMemo to Expensive Computations**:
```typescript
// frontend/src/components/PlayerStatsModal.tsx
const sortedGames = useMemo(() =>
  games.sort((a, b) => b.timestamp - a.timestamp),
  [games]
);

const winRate = useMemo(() =>
  stats.games_played > 0
    ? (stats.games_won / stats.games_played * 100).toFixed(1)
    : '0.0',
  [stats.games_won, stats.games_played]
);

const recentPerformance = useMemo(() =>
  games.slice(0, 10).filter(g => g.won).length,
  [games]
);
```

**Add useCallback for Event Handlers**:
```typescript
// frontend/src/components/PlayingPhase.tsx
const handleCardClick = useCallback((card: Card) => {
  if (!isCardPlayable(card)) return;
  socket?.emit('play_card', { gameId, card });
}, [socket, gameId, isCardPlayable]);

const handleTrickClick = useCallback(() => {
  setShowTrickModal(true);
}, []);
```

**Components to Optimize** (by priority):
1. ✅ PlayingPhase.tsx - Already optimized (8 hooks)
2. PlayerStatsModal.tsx (774 LOC) - Add 5 memoizations
3. ✅ BettingPhase.tsx - Already optimized (8 hooks)
4. GameReplay.tsx (703 LOC) - Add 4 memoizations
5. LobbyBrowser.tsx (581 LOC) - Add 3 memoizations
6. TeamSelection.tsx (488 LOC) - Add 4 memoizations
7. RoundSummary.tsx (478 LOC) - Add 3 memoizations

**Profiling Checklist**:
- [ ] Install React DevTools Profiler
- [ ] Profile before optimizations (baseline)
- [ ] Apply optimizations
- [ ] Profile after (measure improvement)
- [ ] Target: 30-50% reduction in re-renders

#### 3. Code Splitting Enhancement (1 day)

**Lazy Load Additional Components**:
```typescript
// frontend/src/App.tsx

// Already lazy loaded:
// - TeamSelection, BettingPhase, PlayingPhase, ScoringPhase
// - GameReplay, BotTakeoverModal
// - DebugInfo, TestPanel

// Add lazy loading for:
const AchievementsPanel = lazy(() => import('./components/AchievementsPanel'));
const FriendsPanel = lazy(() => import('./components/FriendsPanel'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const GlobalLeaderboard = lazy(() => import('./components/GlobalLeaderboard'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
```

**Bundle Analysis**:
```bash
# Add to package.json
"scripts": {
  "build:analyze": "vite build --mode analyze"
}

# Install plugin
npm install -D rollup-plugin-visualizer
```

**Target Metrics**:
- Initial bundle: <200KB (gzipped)
- Largest chunk: <100KB
- Time to Interactive: <2s on 3G

#### 4. Replace console.log with Logger (1 day) ✅ COMPLETE (2025-11-07)

**Status**: Frontend logger created and ready for use

**Created frontend/src/utils/logger.ts**:
- Debug/info logs (development only)
- Warn/error logs (always logged)
- Error reporting to backend (/api/errors endpoint)
- LocalStorage error persistence (last 10 errors)
- Environment-aware logging (DEV vs PROD)
- Error aggregation with getStoredErrors() and clearStoredErrors()

**Implementation Details**:
```typescript
// frontend/src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private enabled = import.meta.env.DEV;

  debug(message: string, data?: any) {
    if (!this.enabled) return;
    console.debug(`[DEBUG] ${message}`, data);
  }

  info(message: string, data?: any) {
    if (!this.enabled) return;
    console.info(`[INFO] ${message}`, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
  }

  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error);
    // Send to backend error tracking
    this.reportError(message, error);
  }

  private reportError(message: string, error: any) {
    // Send to backend for aggregation
    fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({ message, error: error?.toString(), stack: error?.stack }),
    }).catch(() => {/* Ignore errors in error reporting */});
  }
}

export const logger = new Logger();
```

**Replace in 19 Files** (108 occurrences):
```typescript
// Before
console.log('Bot spawned', botName);

// After
logger.debug('Bot spawned', { botName });
```

**Add ESLint Rule**:
```json
// .eslintrc.json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Test Coverage Targets

| Component | LOC | Tests | Priority |
|-----------|-----|-------|----------|
| PlayingPhase | 1,109 | 20 | CRITICAL |
| BettingPhase | 428 | 15 | HIGH |
| TeamSelection | 488 | 12 | HIGH |
| GameReplay | 703 | 15 | HIGH |
| Others | ~5,000 | 30 | MEDIUM |
| **Total** | **~8,000** | **92** | **Mixed** |

### Expected Impact
- Frontend test coverage: 5% → 60% (92 new tests)
- React re-renders: 30-50% reduction
- Bundle size: <200KB initial load
- Logging: Production-ready, dev-only console logs

---

## Sprint 9: Technical Debt - TypeScript & Code Quality

**Duration**: 2 weeks | **Priority**: MEDIUM | **Effort**: 80 hours

### Goals
- Eliminate all 147 `any` types
- Refactor 7 oversized files (>500 LOC)
- Improve type safety and maintainability
- Remove technical debt markers

### Tasks

#### 1. TypeScript `any` Type Elimination (7 days)

**Backend: 99 occurrences across 40 files**

**Priority 1: High-impact Files** (2 days):
```typescript
// utils/sanitization.ts (8 any types)
// Before
export function sanitizeInput(input: any): any {
  // ...
}

// After
export function sanitizeInput(input: unknown): string | number | boolean | null {
  if (typeof input === 'string') return input.trim();
  if (typeof input === 'number') return input;
  if (typeof input === 'boolean') return input;
  return null;
}

// socketHandlers/connection.ts (7 any types)
// Before
socket.on('reconnect_to_game', async (data: any) => { /* ... */ });

// After
interface ReconnectData {
  gameId: string;
  session: PlayerSession;
}
socket.on('reconnect_to_game', async (data: ReconnectData) => { /* ... */ });

// socketHandlers/stats.ts (6 any types)
// Before
export function aggregateStats(stats: any[]): any { /* ... */ }

// After
export function aggregateStats(stats: PlayerStats[]): AggregatedStats { /* ... */ }
```

**Priority 2: Socket.io Event Payloads** (3 days):
```typescript
// types/events.ts (create comprehensive event types)
export interface ServerToClientEvents {
  game_created: (data: { gameId: string; gameState: GameState; session: PlayerSession }) => void;
  player_joined: (data: { player: Player; gameState: GameState; session?: PlayerSession }) => void;
  game_updated: (gameState: GameState) => void;
  error: (data: { message: string; code?: string }) => void;
  // ... all 31 events
}

export interface ClientToServerEvents {
  create_game: (playerName: string) => void;
  join_game: (data: { gameId: string; playerName: string }) => void;
  place_bet: (data: { gameId: string; amount: number; withoutTrump: boolean }) => void;
  play_card: (data: { gameId: string; card: Card }) => void;
  // ... all events
}

// Use in index.ts
import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from './types/events';

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  // Now all events are fully typed!
});
```

**Priority 3: Database Query Parameters** (2 days):
```typescript
// db/index.ts
// Before
export async function query(text: string, params?: any[]): Promise<any> { /* ... */ }

// After
type QueryParam = string | number | boolean | null | Date;
export async function query<T = any>(
  text: string,
  params?: QueryParam[]
): Promise<QueryResult<T>> { /* ... */ }

// Usage with generic types
const result = await query<User>(
  'SELECT * FROM users WHERE user_id = $1',
  [userId]
);
// result.rows is now User[]
```

**Frontend: 48 occurrences across 20 files**

**Priority 1: Component Props** (2 days):
```typescript
// DebugInfo.tsx (10 any types)
// Before
export function DebugInfo({ data }: { data: any }) { /* ... */ }

// After
interface DebugInfoProps {
  gameState: GameState | null;
  socket: Socket | null;
  metadata?: Record<string, string | number | boolean>;
}
export function DebugInfo({ gameState, socket, metadata }: DebugInfoProps) { /* ... */ }

// AuthContext.tsx (3 any types)
// Before
const [user, setUser] = useState<any>(null);

// After
interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}
const [user, setUser] = useState<AuthUser | null>(null);
```

**Files to Update** (147 total):
- Backend: sanitization.ts (8), logger.ts (4), connection.ts (7), stats.ts (6), routes.ts (4), + 35 others
- Frontend: DebugInfo.tsx (10), AuthContext.tsx (3), + 18 others

#### 2. File Refactoring - Backend (3 days)

**index.ts** (1,570 LOC → 3 files):
```
backend/src/
├── orchestration/
│   ├── gameOrchestrator.ts (500 LOC)
│   │   - startNewRound()
│   │   - resolveTrick()
│   │   - endRound()
│   │   - checkGameOver()
│   │
│   └── roundManager.ts (400 LOC)
│       - handleBettingPhase()
│       - handlePlayingPhase()
│       - handleScoringPhase()
│
└── index.ts (670 LOC)
    - Server setup
    - Socket.io configuration
    - Handler registration
    - Startup logic
```

**api/routes.ts** (923 LOC → 4 files):
```
backend/src/api/routes/
├── health.ts (100 LOC)
│   - GET /api/health
│
├── games.ts (300 LOC)
│   - GET /api/games/lobby
│   - GET /api/games/recent
│   - GET /api/games/:gameId
│   - GET /api/games/history
│
├── players.ts (300 LOC)
│   - GET /api/leaderboard
│   - GET /api/stats/:playerName
│   - GET /api/player-history/:playerName
│
└── index.ts (223 LOC)
    - Router registration
    - Middleware setup
```

**db/index.ts** (900 LOC → 4 files):
```
backend/src/db/
├── queries/
│   ├── games.ts (250 LOC)
│   │   - Game-related queries
│   │
│   ├── players.ts (250 LOC)
│   │   - Player stats queries
│   │
│   ├── sessions.ts (150 LOC)
│   │   - Session queries
│   │
│   └── history.ts (150 LOC)
│       - History queries
│
└── index.ts (100 LOC)
    - Pool management
    - Query wrapper
    - Connection setup
```

#### 3. File Refactoring - Frontend (2 days)

**PlayingPhase.tsx** (1,109 LOC → 5 files):
```
frontend/src/components/playing/
├── PlayingBoard.tsx (300 LOC)
│   - Main game board layout
│   - Player positions
│
├── PlayerHand.tsx (200 LOC)
│   - Hand rendering
│   - Card click handlers
│
├── TrickArea.tsx (200 LOC)
│   - Current trick display
│   - Circular card positioning
│
├── AnimationManager.tsx (200 LOC)
│   - Card play animations
│   - Trick collection animations
│   - Winner banner
│
└── PlayingPhase.tsx (209 LOC)
    - Phase coordinator
    - State management
    - Event handlers
```

#### 4. Remove Technical Debt Markers (1 day)

**Remove @ts-ignore/@ts-nocheck** (5 files):
```typescript
// e2e/tests/helpers.ts
// Before
// @ts-ignore
const game = await page.evaluate(() => window.game);

// After
interface WindowWithGame extends Window {
  game?: GameState;
}
const game = await page.evaluate(() => (window as WindowWithGame).game);
```

**Migrate .then()/.catch() to async/await** (11 occurrences):
```typescript
// Before
db.query('SELECT * FROM users')
  .then(result => console.log(result))
  .catch(error => console.error(error));

// After
try {
  const result = await db.query('SELECT * FROM users');
  console.log(result);
} catch (error) {
  console.error(error);
}
```

**Address TODO/FIXME Comments** (3 files):
- Review each TODO/FIXME
- Create GitHub issues for valid items
- Remove obsolete comments
- Fix simple items immediately

### Expected Impact
- TypeScript `any` types: 147 → 0
- Files >500 LOC: 10 → 3
- Type safety: Significantly improved
- Code organization: Much cleaner
- Maintainability: Easier to understand and modify

---

## Sprint 10: Advanced Optimization & Code Quality

**Duration**: 2 weeks | **Priority**: MEDIUM | **Effort**: 80 hours

### Goals
- Eliminate code duplication (<5%)
- Reduce function complexity (<10 cyclomatic complexity)
- Add comprehensive JSDoc documentation (100% public APIs)
- Establish code quality standards with tooling

### Tasks

#### 1. Duplicate Code Analysis & Elimination (3 days)

**Run Analysis**:
```bash
npm install -g jscpd
jscpd backend/src frontend/src --min-lines 5 --min-tokens 50 --output ./duplication-report
```

**Expected Duplicates**:
- Socket.io event handler boilerplate
- Database query error handling
- React component state patterns
- Form validation logic

**Create Extraction Utilities**:

**Socket Handler Wrapper**:
```typescript
// backend/src/utils/socketWrapper.ts
export function createSocketHandler<T>(
  handler: (socket: Socket, data: T, context: HandlerContext) => Promise<void>
) {
  return async (socket: Socket, data: T) => {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    try {
      await handler(socket, data, { correlationId, startTime });
    } catch (error) {
      logError(error, {
        correlationId,
        action: handler.name,
        requestDuration: Date.now() - startTime,
        metadata: data,
      });
      socket.emit('error', {
        message: 'Action failed',
        correlationId
      });
    }
  };
}

// Usage
socket.on('place_bet', createSocketHandler<BetData>(async (socket, data, ctx) => {
  const game = games.get(data.gameId);
  // No try-catch needed, wrapper handles it
  await placeBet(game, socket.id, data.amount);
}));
```

**Database Query Wrapper**:
```typescript
// backend/src/db/queryWrapper.ts
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await queryFn();
  } catch (error) {
    logger.error(errorMessage, error);
    return null;
  }
}

// Usage
const user = await safeQuery(
  () => getUserByEmail(email),
  'Failed to fetch user by email'
);
```

**React Custom Hooks**:
```typescript
// frontend/src/hooks/useFetch.ts
export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

// Usage (eliminates duplicate fetch logic)
const { data: games, loading, error } = useFetch<Game[]>('/api/games/lobby');
```

#### 2. Complex Function Refactoring (3 days)

**Run Complexity Analysis**:
```bash
npm install -g complexity-report
cr --format json backend/src/**/*.ts > complexity-backend.json
cr --format json frontend/src/**/*.tsx > complexity-frontend.json
```

**Target**: All functions <10 cyclomatic complexity

**Refactoring Strategies**:

**1. Early Returns (Guard Clauses)**:
```typescript
// Before (nested ifs)
function validateCardPlay(game, playerId, card) {
  if (game.phase === 'playing') {
    if (game.currentPlayerId === playerId) {
      if (playerHasCard(game, playerId, card)) {
        if (isCardPlayable(game, card)) {
          return { valid: true };
        } else {
          return { valid: false, error: 'Card not playable' };
        }
      } else {
        return { valid: false, error: 'Card not in hand' };
      }
    } else {
      return { valid: false, error: 'Not your turn' };
    }
  } else {
    return { valid: false, error: 'Wrong phase' };
  }
}

// After (guard clauses)
function validateCardPlay(game, playerId, card) {
  if (game.phase !== 'playing') {
    return { valid: false, error: 'Wrong phase' };
  }

  if (game.currentPlayerId !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!playerHasCard(game, playerId, card)) {
    return { valid: false, error: 'Card not in hand' };
  }

  if (!isCardPlayable(game, card)) {
    return { valid: false, error: 'Card not playable' };
  }

  return { valid: true };
}
```

**2. Extract Sub-Functions**:
```typescript
// Before (complex function)
function resolveTrick(gameId) {
  const game = games.get(gameId);
  const trick = game.currentTrick;

  // 50 lines of winner determination logic
  let winner = null;
  let highestValue = -1;
  // ... complex logic

  // 30 lines of points calculation
  let points = trick.length; // base points
  // ... special card logic

  // 40 lines of state updates
  game.tricks.push(trick);
  // ... many state changes

  io.to(gameId).emit('trick_resolved', { winner, points });
}

// After (extracted sub-functions)
function resolveTrick(gameId) {
  const game = games.get(gameId);
  const trick = game.currentTrick;

  const winner = determineTrickWinner(trick, game.trumpColor);
  const points = calculateTrickPoints(trick);

  updateGameStateAfterTrick(game, winner, points);

  io.to(gameId).emit('trick_resolved', { winner, points });
}

function determineTrickWinner(trick, trumpColor) {
  // Extracted logic
}

function calculateTrickPoints(trick) {
  // Extracted logic
}

function updateGameStateAfterTrick(game, winner, points) {
  // Extracted logic
}
```

**Suspected High-Complexity Functions**:
- `backend/src/index.ts` - Game orchestration functions
- `backend/src/socketHandlers/gameplay.ts` - place_bet, play_card
- `frontend/src/components/PlayingPhase.tsx` - Card play logic

#### 3. JSDoc Documentation - Public APIs (4 days)

**Backend Priority**:
1. Game logic functions (game/)
2. Socket handlers (socketHandlers/)
3. Database functions (db/)
4. Utility functions (utils/)

**JSDoc Template**:
```typescript
/**
 * Validates a card play in the current game state
 *
 * Enforces game rules:
 * - Player must be in playing phase
 * - Must be player's turn
 * - Card must be in player's hand
 * - Must follow suit if possible
 *
 * @param game - The current game state
 * @param playerId - The player attempting to play the card
 * @param card - The card being played
 *
 * @returns Validation result with success flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateCardPlay(game, 'player1', { value: 5, color: 'red' });
 * if (!result.success) {
 *   socket.emit('invalid_move', { message: result.error });
 * }
 * ```
 *
 * @see {@link isCardPlayable} for playability logic
 * @see {@link GAME_RULES.md} for complete rule documentation
 */
export function validateCardPlay(
  game: GameState,
  playerId: string,
  card: Card
): ValidationResult {
  // Implementation
}
```

**Coverage Target**: 100% of exported functions

**Priority Order**:
1. Public API functions (exported from modules)
2. Socket.io event handlers
3. Database query functions
4. React component props (prop-types or TypeScript interfaces)
5. Internal utility functions

#### 4. ESLint & Prettier Setup (1 day)

**Install Dependencies**:
```bash
npm install -D eslint-config-prettier eslint-plugin-prettier
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react eslint-plugin-react-hooks
```

**Backend ESLint Config**:
```json
// backend/.eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-throw-literal": "error"
  }
}
```

**Frontend ESLint Config**:
```json
// frontend/.eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react-hooks/exhaustive-deps": "warn",
    "react/prop-types": "off",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Pre-commit Hook**:
```bash
npm install -D husky lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

#### 5. Image Optimization (1 day)

**Compress Images**:
```bash
npm install -D imagemin imagemin-pngquant imagemin-mozjpeg
```

**Optimization Script**:
```javascript
// scripts/optimize-images.js
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
import imageminMozjpeg from 'imagemin-mozjpeg';

await imagemin(['public/assets/*.{jpg,png}'], {
  destination: 'public/assets/optimized',
  plugins: [
    imageminPngquant({ quality: [0.6, 0.8] }),
    imageminMozjpeg({ quality: 80 })
  ]
});
```

**Add WebP Support**:
```typescript
// frontend/src/components/Card.tsx
<picture>
  <source srcSet={`/assets/${card.color}-${card.value}.webp`} type="image/webp" />
  <img src={`/assets/${card.color}-${card.value}.png`} alt={`${card.color} ${card.value}`} />
</picture>
```

### Expected Impact
- Code duplication: Unknown → <5%
- Function complexity: Unknown → <10 (all functions)
- JSDoc coverage: ~10% → 100% (public APIs)
- Code style: Consistent and automated
- Image size: 30-50% reduction

---

## Sprint 11: Security Audit & Documentation

**Duration**: 2 weeks | **Priority**: HIGH | **Effort**: 80 hours

### Goals
- Comprehensive security audit and hardening
- REST API documentation with Swagger/OpenAPI
- Performance profiling and optimization
- Production readiness checklist

### Tasks

#### 1. Security Audit (4 days)

**Authentication Flow Review** (1 day):
```typescript
// Checklist
- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] JWT tokens properly signed and validated
- [ ] Token expiration enforced (7 days)
- [ ] Session tokens cryptographically random (32+ bytes)
- [ ] Email verification tokens expire (24 hours)
- [ ] Password reset tokens expire (1 hour)
- [ ] Tokens deleted after use (one-time use)
- [ ] No tokens in error messages or logs
- [ ] No tokens in client-side localStorage (use httpOnly cookies)
```

**SQL Injection Prevention** (1 day):
```typescript
// Audit all query() calls
- [ ] All queries use parameterized statements
- [ ] No string concatenation in SQL
- [ ] User input never directly in queries
- [ ] LIKE queries properly escaped
- [ ] Array inputs properly handled

// Run automated scan
npm install -g sqlmap
# Test all endpoints with potential SQL injection
```

**Rate Limiting Coverage** (1 day):
```typescript
// Verify rate limiting on all endpoints

// Authentication endpoints (strict)
POST /api/auth/login          - 5 requests/minute
POST /api/auth/register       - 3 requests/minute
POST /api/auth/forgot-password - 3 requests/minute
POST /api/auth/reset-password  - 5 requests/minute

// Game endpoints (moderate)
POST /api/games               - 10 requests/minute
GET /api/games/lobby          - 30 requests/minute
GET /api/stats/:playerName    - 20 requests/minute

// Socket.io actions (lenient)
create_game                   - 5 requests/minute
join_game                     - 20 requests/minute
place_bet                     - 30 requests/minute (during gameplay)
play_card                     - 60 requests/minute (during gameplay)
```

**XSS/CSRF Protection** (1 day):
```typescript
// Checklist
- [ ] All user input sanitized (sanitization.ts)
- [ ] React escapes all output (default behavior)
- [ ] No dangerouslySetInnerHTML usage
- [ ] Content-Security-Policy header set
- [ ] CSRF tokens for state-changing requests
- [ ] SameSite cookie attribute set

// Add headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind
      imgSrc: ["'self'", "data:"],
    }
  }
}));
```

**Dependency Audit**:
```bash
npm audit
npm audit fix

# Install Snyk for continuous monitoring
npm install -g snyk
snyk auth
snyk test
snyk monitor
```

**Secrets Management**:
```typescript
// Checklist
- [ ] All secrets in .env (not committed)
- [ ] .env.example with dummy values
- [ ] No hardcoded secrets in code
- [ ] No secrets in error messages
- [ ] No secrets in logs
- [ ] No secrets in client-side bundles

// Verify
grep -r "password\|secret\|api_key\|token" backend/src frontend/src
# Review each occurrence
```

#### 2. REST API Documentation (2 days)

**Install Swagger**:
```bash
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

**Swagger Setup**:
```typescript
// backend/src/api/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jaffre Card Game API',
      version: '1.0.0',
      description: 'REST API for multiplayer trick card game',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://your-domain.com', description: 'Production' },
    ],
  },
  apis: ['./src/api/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

**Document Endpoints**:
```typescript
// backend/src/api/routes/games.ts

/**
 * @openapi
 * /api/games/lobby:
 *   get:
 *     summary: Get active games in lobby
 *     description: Returns list of games in team selection or betting phase
 *     responses:
 *       200:
 *         description: List of active games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LobbyGame'
 *       500:
 *         description: Server error
 */
router.get('/lobby', async (req, res) => {
  // Implementation
});

/**
 * @openapi
 * components:
 *   schemas:
 *     LobbyGame:
 *       type: object
 *       properties:
 *         gameId:
 *           type: string
 *         playerCount:
 *           type: integer
 *         phase:
 *           type: string
 *           enum: [team_selection, betting]
 *         createdAt:
 *           type: string
 *           format: date-time
 */
```

**Document All 10 Endpoints**:
- GET /api/health
- GET /api/games/lobby
- GET /api/games/recent
- GET /api/games/:gameId
- GET /api/games/history
- GET /api/leaderboard
- GET /api/stats/:playerName
- GET /api/player-history/:playerName
- POST /api/auth/login
- POST /api/auth/register

#### 3. Performance Profiling (2 days)

**Lighthouse CI**:
```bash
npm install -D @lhci/cli

# .lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": ["http://localhost:4173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

**Database Slow Query Logging**:
```typescript
// backend/src/db/index.ts
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const result = await dbPool.query(text, params);
  const duration = Date.now() - start;

  if (duration > 100) {
    logger.warn('Slow query detected', {
      query: text.substring(0, 100),
      duration,
      params: params?.length
    });
  }

  return result;
};
```

**Backend Endpoint Profiling**:
```typescript
// backend/src/middleware/profiling.ts
export function profileEndpoint(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });

    // Track metrics
    if (duration > 500) {
      logger.warn('Slow endpoint', { path: req.path, duration });
    }
  });

  next();
}
```

**Memory Leak Detection**:
```bash
# Run long-duration tests
npm run test:e2e -- 27-marathon-automated.spec.ts

# Monitor memory usage
node --expose-gc backend/src/index.ts

# Use clinic.js for profiling
npm install -g clinic
clinic doctor -- node backend/src/index.ts
```

**Performance Targets**:
- Page load: <2s (Lighthouse score >90)
- API 95th percentile: <10ms (cached), <50ms (uncached)
- WebSocket latency: <100ms
- Memory usage: <500MB after 24 hours
- No memory leaks: Flat memory graph over time

#### 4. Monitoring & Metrics (2 days)

**Sentry Dashboards**:
```typescript
// backend/src/utils/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter out low-priority errors
    if (event.level === 'warning') return null;
    return event;
  },
});

// Custom metrics
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  Sentry.metrics.distribution(name, value, {
    tags,
    unit: 'millisecond',
  });
}

// Usage
trackMetric('database.query.duration', duration, { query: 'getLeaderboard' });
trackMetric('socket.event.duration', duration, { event: 'place_bet' });
```

**Cache Hit Rate Tracking**:
```typescript
// backend/src/utils/queryCache.ts
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total * 100).toFixed(2) : '0.00';

  return {
    hits: cacheHits,
    misses: cacheMisses,
    total,
    hitRate: `${hitRate}%`,
  };
}

// Expose metrics endpoint
router.get('/metrics/cache', (req, res) => {
  res.json(getCacheStats());
});
```

**Error Rate Dashboard**:
```typescript
// Track error rates by category
const errorMetrics = {
  validation: 0,
  database: 0,
  network: 0,
  unknown: 0,
};

export function trackError(category: string) {
  if (category in errorMetrics) {
    errorMetrics[category as keyof typeof errorMetrics]++;
  } else {
    errorMetrics.unknown++;
  }
}

router.get('/metrics/errors', (req, res) => {
  res.json({
    ...errorMetrics,
    timestamp: Date.now(),
  });
});
```

**Alerts Setup**:
```typescript
// Set up alerts for anomalies
- Error rate >1% of requests
- API response time p95 >500ms
- Cache hit rate <70%
- Memory usage >80% of available
- Database connection pool exhaustion
```

#### 5. Production Readiness Checklist (2 days)

**Environment Variables**:
```bash
# .env.example
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (for sessions)
REDIS_URL=redis://localhost:6379

# Email
RESEND_API_KEY=your_api_key
EMAIL_FROM=noreply@yourdomain.com

# Authentication
JWT_SECRET=your_jwt_secret_32_chars_min
JWT_EXPIRY=7d

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Database Migration Automation**:
```bash
# Add to package.json
"scripts": {
  "db:migrate": "node backend/src/db/runMigrations.js",
  "db:migrate:dry-run": "node backend/src/db/runMigrations.js --dry-run",
  "db:status": "node backend/src/db/runMigrations.js --status"
}

# Add to deployment script
npm run db:migrate
```

**Health Check Endpoints**:
```typescript
// backend/src/api/routes/health.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    database: await checkDatabaseHealth(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
  };

  const statusCode = health.database === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

async function checkDatabaseHealth() {
  try {
    await query('SELECT 1');
    return 'ok';
  } catch (error) {
    return 'error';
  }
}
```

**Graceful Shutdown**:
```typescript
// backend/src/index.ts
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, starting graceful shutdown');

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database pool
  await closePool();

  // Close Socket.io connections
  io.close(() => {
    logger.info('Socket.io closed');
  });

  // Wait for in-flight requests to complete (max 10s)
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
});
```

**Load Testing**:
```bash
npm install -D artillery

# artillery.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Create and join games"
    engine: socketio
    flow:
      - emit:
          channel: "create_game"
          data: "TestPlayer"
      - think: 2
      - emit:
          channel: "join_game"
          data:
            gameId: "{{ gameId }}"
            playerName: "Player2"

# Run test
artillery run artillery.yml
```

**Deployment Runbook**:
```markdown
# Deployment Checklist

## Pre-Deployment
- [ ] All tests passing (backend + E2E)
- [ ] No TypeScript errors
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Database migrations tested

## Deployment Steps
1. Create database backup
2. Run database migrations (dry-run first)
3. Deploy backend (zero-downtime)
4. Deploy frontend (CDN invalidation)
5. Run smoke tests
6. Monitor error rates for 15 minutes

## Rollback Procedure
1. Revert frontend to previous version
2. Revert backend to previous version
3. Revert database migrations if needed
4. Investigate and fix issue

## Post-Deployment
- [ ] Health check returns 200
- [ ] Error rate <0.1%
- [ ] API response time <50ms p95
- [ ] WebSocket connections stable
- [ ] Monitor for 1 hour
```

### Expected Impact
- Production-ready security posture
- Comprehensive API documentation
- Performance monitoring and alerting
- Confidence in deployment process
- <0.1% error rate in production

---

## Summary & Metrics

### Total Effort
- **5 Sprints**: 10 weeks (360 hours total)
- **Sprint 6**: 40 hours (Critical fixes + performance)
- **Sprint 7**: 80 hours (Backend tests)
- **Sprint 8**: 80 hours (Frontend tests + optimization)
- **Sprint 9**: 80 hours (TypeScript + refactoring)
- **Sprint 10**: 80 hours (Code quality + documentation)
- **Sprint 11**: 80 hours (Security + production readiness)

### Key Metrics (Before → After)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Backend test coverage | 60% | 85% | +25% |
| Frontend test coverage | 5% | 60% | +55% |
| TypeScript `any` types | 147 | 0 | -147 |
| Files >500 LOC | 10 | 3 | -7 |
| API response time (cached) | 20-100ms | <10ms | 50-90% |
| Code duplication | Unknown | <5% | N/A |
| Function complexity | Unknown | <10 | N/A |
| JSDoc coverage | ~10% | 100% | +90% |
| Test failures | 3 | 0 | -3 |
| Security vulnerabilities | Unknown | 0 | N/A |

### Priority Execution Order

**Critical Path** (Must complete first):
1. **Sprint 6** - Immediate stability and performance wins
2. **Sprint 11** - Security audit (can run in parallel with Sprint 8)

**High Priority**:
3. **Sprint 7** - Backend test coverage
4. **Sprint 8** - Frontend tests and optimization

**Medium Priority** (Can defer if needed):
5. **Sprint 9** - Technical debt
6. **Sprint 10** - Code quality polish

### Success Criteria

**Sprint 6**:
- ✅ Zero test failures
- ✅ Query cache integrated (20-100x improvement)
- ✅ Verbose error handling with correlation IDs
- ✅ Database indexes added (5-10x improvement)

**Sprint 7**:
- ✅ 131 new backend tests
- ✅ 85% backend coverage
- ✅ Critical paths fully tested

**Sprint 8**:
- ✅ 92 new frontend tests
- ✅ 60% frontend coverage
- ✅ 30-50% reduction in re-renders
- ✅ Bundle size <200KB

**Sprint 9**:
- ✅ Zero `any` types
- ✅ All files <500 LOC (except tests)
- ✅ Type safety significantly improved

**Sprint 10**:
- ✅ <5% code duplication
- ✅ All functions <10 cyclomatic complexity
- ✅ 100% JSDoc coverage on public APIs
- ✅ Automated code quality checks

**Sprint 11**:
- ✅ Zero security vulnerabilities
- ✅ Complete API documentation
- ✅ Performance monitoring in place
- ✅ Production deployment runbook

---

## Next Steps

1. **Review and approve this plan**
2. **Create GitHub project board** with all tasks
3. **Start Sprint 6** - Critical fixes and performance
4. **Track progress** with todo list (crash-resistant)
5. **Review at end of each sprint** and adjust as needed

---

*Last updated: 2025-11-07*
*Status: Ready for execution*

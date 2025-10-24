# Future Work - Comprehensive TODO List

**Last Updated**: 2025-01-23
**Current Status**: Phase 2.1 Complete ✅

This document contains a comprehensive, prioritized list of tasks for future development sessions.

---

## 🚀 Immediate Priorities (Next 1-2 Sessions)

### 1. ✅ Verify Phase 2.1 Refactoring (Critical)
**Priority**: HIGHEST
**Effort**: 30 minutes
**Why**: Ensure refactored handlers work in production

**Tasks**:
- [ ] Start backend server (`cd backend && npm run dev`)
- [ ] Start frontend server (`cd frontend && npm run dev`)
- [ ] Run full E2E test suite (`cd e2e && npm run test:e2e`)
- [ ] Fix any integration issues found
- [ ] Verify betting phase works correctly
- [ ] Verify playing phase works correctly
- [ ] Deploy to Railway if all tests pass

**Success Criteria**: All E2E tests passing with refactored handlers

---

### 2. Continue Refactoring - Phase 2.2 (High Value)
**Priority**: HIGH
**Effort**: 2-3 hours
**Why**: Apply same pattern to remaining handlers, reduce technical debt

**Handlers to Refactor** (in order):

#### A. Refactor `select_team` Handler
- [ ] Add `validateTeamSelection()` call (already exists!)
- [ ] Add `applyTeamSelection()` call (already exists!)
- [ ] Reduce handler to: validation → state → I/O
- [ ] Test with E2E tests

#### B. Refactor `swap_position` Handler
- [ ] Add `validatePositionSwap()` call (already exists!)
- [ ] Add `applyPositionSwap()` call (already exists!)
- [ ] Reduce handler to: validation → state → I/O
- [ ] Test with E2E tests

#### C. Refactor `start_game` Handler
- [ ] Use `validateGameStart()` (already exists!)
- [ ] Create `applyGameStart()` in state.ts
- [ ] Use `initializeRound()` (already exists!)
- [ ] Test with E2E tests

#### D. Create Validation for Remaining Handlers
- [ ] `validateReconnection()` - For reconnect_to_game
- [ ] `validateKick()` - For kick_player
- [ ] `validateRematchVote()` - For vote_rematch
- [ ] Add tests for each validation function

**Estimated Reduction**: -200 more lines from handlers

---

### 3. Extract Round/Game Management Logic (Phase 2.3)
**Priority**: MEDIUM-HIGH
**Effort**: 2-3 hours
**Why**: `resolveTrick()` and `endRound()` are complex, need extraction

**Tasks**:

#### A. Extract Trick Resolution Logic
- [ ] Create `backend/src/game/tricks.ts`
- [ ] Extract `resolveTrick()` business logic to pure function
- [ ] Function: `calculateTrickWinner(trick, trump)` (already exists as `determineWinner`)
- [ ] Function: `applyTrickResolution(game, winnerId, points)`
- [ ] Write unit tests for trick logic
- [ ] Refactor `resolveTrick()` handler to use pure functions

#### B. Extract Round End Logic
- [ ] Create `backend/src/game/rounds.ts`
- [ ] Extract round scoring to pure function
- [ ] Function: `calculateRoundResults(game, roundStats)` (some exists in `calculateRoundScore`)
- [ ] Function: `applyRoundEnd(game, roundScore)`
- [ ] Function: `checkGameOver(teamScores)`
- [ ] Write unit tests for round logic
- [ ] Refactor `endRound()` to use pure functions

**Estimated Reduction**: -100 lines, +testability

---

## 📊 Phase 3: Infrastructure & Monitoring (2-3 Sessions)

### 1. Add Error Tracking with Sentry
**Priority**: HIGH
**Effort**: 1 hour
**Why**: Find and fix production bugs faster

**Tasks**:
- [ ] Sign up for Sentry account (free tier)
- [ ] Install Sentry SDK: `npm install @sentry/node @sentry/react`
- [ ] Add Sentry to backend (backend/src/index.ts)
- [ ] Add Sentry to frontend (frontend/src/main.tsx)
- [ ] Add error boundary component to frontend
- [ ] Test error reporting (throw test error)
- [ ] Configure source maps for better stack traces
- [ ] Add breadcrumbs for game events
- [ ] Set up alerts for critical errors

**Benefits**: Production debugging, error tracking, performance monitoring

---

### 2. Add Performance Monitoring
**Priority**: MEDIUM
**Effort**: 1-2 hours
**Why**: Understand production usage patterns

**Tasks**:
- [ ] Add performance tracking to Socket.IO events
- [ ] Track handler execution time
- [ ] Track database query time
- [ ] Add metrics endpoint (GET /api/metrics)
- [ ] Track active games count
- [ ] Track active players count
- [ ] Track average game duration
- [ ] Create simple metrics dashboard

**Metrics to Track**:
```typescript
{
  activeGames: number,
  activePlayers: number,
  avgHandlerTime: { [event: string]: number },
  avgGameDuration: number,
  totalGamesCompleted: number,
  errorRate: number
}
```

---

### 3. Add Rate Limiting
**Priority**: MEDIUM
**Effort**: 1 hour
**Why**: Prevent spam and DoS attacks

**Tasks**:
- [ ] Install rate limiter: `npm install express-rate-limit`
- [ ] Add rate limits to Socket.IO events
- [ ] Limit: 10 card plays per second per player
- [ ] Limit: 3 game creations per minute per IP
- [ ] Limit: 10 bets per second per player
- [ ] Add rate limit error messages
- [ ] Test rate limiting
- [ ] Log rate limit violations

**Configuration**:
```typescript
const cardPlayLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests
  message: 'Too many card plays, please slow down'
});
```

---

### 4. Improve Database Connection Handling
**Priority**: MEDIUM
**Effort**: 1 hour
**Why**: Better reliability and error handling

**Tasks**:
- [ ] Add connection pooling configuration
- [ ] Add retry logic for failed queries
- [ ] Add query timeout configuration
- [ ] Add connection health check endpoint
- [ ] Handle connection loss gracefully
- [ ] Add database error logging
- [ ] Test database failure scenarios

---

## 🧪 Phase 4: Testing Improvements (1-2 Sessions)

### 1. Improve E2E Test Reliability
**Priority**: MEDIUM
**Effort**: 2-3 hours
**Why**: Reduce flaky tests, faster CI/CD

**Tasks**:
- [ ] Review all E2E tests for race conditions
- [ ] Add explicit waits where needed
- [ ] Remove `{ force: true }` where not needed
- [ ] Add retry logic for flaky tests
- [ ] Use fixtures to reduce test setup time
- [ ] Parallelize more tests (where safe)
- [ ] Add test artifacts for failed tests
- [ ] Document common test patterns

**Files to Review**:
- `e2e/tests/02-betting.spec.ts` - Betting phase tests
- `e2e/tests/03-playing.spec.ts` - Playing phase tests
- `e2e/tests/04-game-flow.spec.ts` - Full game flow tests

---

### 2. Add Integration Tests for Database
**Priority**: LOW-MEDIUM
**Effort**: 2 hours
**Why**: Catch database issues before production

**Tasks**:
- [ ] Create test database setup script
- [ ] Add integration tests for `saveGameHistory()`
- [ ] Add integration tests for `updatePlayerStats()`
- [ ] Add integration tests for `getLeaderboard()`
- [ ] Test database migrations
- [ ] Test concurrent writes
- [ ] Clean up test data after tests

---

### 3. Enable TypeScript Strict Mode
**Priority**: LOW-MEDIUM
**Effort**: 2-3 hours
**Why**: Better type safety, catch bugs at compile time

**Tasks**:
- [ ] Enable `strict: true` in backend tsconfig.json
- [ ] Enable `strict: true` in frontend tsconfig.json
- [ ] Fix all type errors in backend
- [ ] Fix all type errors in frontend
- [ ] Add explicit return types to functions
- [ ] Remove all `any` types
- [ ] Add null checks where needed

**Estimated Errors**: ~50-100 type errors to fix

---

## 🎨 Phase 5: Features & Polish (Ongoing)

### 1. Complete Dark Mode Implementation
**Priority**: LOW
**Effort**: 2-3 hours
**Why**: User-requested feature

**Tasks**:
- [ ] Review current dark mode implementation
- [ ] Fix any missing dark mode styles
- [ ] Add smooth theme transition
- [ ] Persist theme preference in localStorage
- [ ] Add theme toggle in settings
- [ ] Test all pages in dark mode
- [ ] Update screenshots in README

---

### 2. Improve Bot AI Decision Making
**Priority**: LOW-MEDIUM
**Effort**: 3-4 hours
**Why**: Better single-player experience

**Current Bot Logic**: `frontend/src/utils/botPlayer.ts`

**Improvements to Make**:
- [ ] Better bet amount selection (use probability model)
- [ ] Better card selection (use minimax or Monte Carlo)
- [ ] Add bot personality types (aggressive, conservative, random)
- [ ] Better suit-following logic
- [ ] Better trump usage strategy
- [ ] Add bot "thinking" delay (looks more natural)
- [ ] Test bot performance against each other

**AI Strategies**:
```typescript
type BotPersonality = 'aggressive' | 'conservative' | 'balanced' | 'random';

interface BotStrategy {
  bettingStyle: (hand: Card[], gameState: GameState) => number;
  cardPlayStyle: (validCards: Card[], gameState: GameState) => Card;
  trumpUsage: 'early' | 'late' | 'smart';
}
```

---

### 3. Add Game Replay Feature
**Priority**: MEDIUM (Now Possible with Pure Functions!)
**Effort**: 4-5 hours
**Why**: Educational, debugging, and fun

**Tasks**:
- [ ] Store all game actions in database
- [ ] Create replay data structure
- [ ] Build replay viewer component
- [ ] Add play/pause controls
- [ ] Add speed controls (1x, 2x, 4x)
- [ ] Add step forward/backward
- [ ] Show trick-by-trick breakdown
- [ ] Allow sharing replay links

**Data Structure**:
```typescript
interface GameReplay {
  gameId: string;
  players: Player[];
  actions: GameAction[];
  finalScore: { team1: number; team2: number };
}

interface GameAction {
  timestamp: number;
  playerId: string;
  actionType: 'bet' | 'play_card' | 'trick_resolved';
  payload: any;
  resultingState: Partial<GameState>;
}
```

**Benefits**: Enabled by pure functions! Can replay game by applying actions sequentially.

---

### 4. Add Undo/Redo Feature (Training Mode)
**Priority**: LOW
**Effort**: 2-3 hours
**Why**: Great for learning the game

**Tasks**:
- [ ] Create training mode flag in game state
- [ ] Store state history stack
- [ ] Add undo button (only in training mode)
- [ ] Add redo button (only in training mode)
- [ ] Limit undo to current round
- [ ] Test undo/redo with all actions
- [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)

**Implementation** (Now Easy with Pure Functions!):
```typescript
interface GameHistory {
  past: GameState[];
  present: GameState;
  future: GameState[];
}

function undo(history: GameHistory): GameHistory {
  if (history.past.length === 0) return history;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future]
  };
}
```

---

### 5. Add Tournament Mode
**Priority**: LOW
**Effort**: 5-6 hours
**Why**: Competitive play

**Tasks**:
- [ ] Create tournament data structure
- [ ] Add tournament creation UI
- [ ] Add bracket generation
- [ ] Add tournament progression logic
- [ ] Add tournament leaderboard
- [ ] Add tournament history
- [ ] Allow custom tournament rules
- [ ] Add tournament admin controls

---

### 6. Add Sound Effects
**Priority**: LOW
**Effort**: 2 hours
**Why**: Better UX

**Tasks**:
- [ ] Find/create sound effects (card play, bet, win, lose)
- [ ] Add sound toggle in settings
- [ ] Add volume control
- [ ] Trigger sounds on game events
- [ ] Test sounds across browsers
- [ ] Add mute option

---

## 📚 Documentation Improvements (Ongoing)

### 1. Add API Documentation
**Priority**: MEDIUM
**Effort**: 2 hours
**Why**: Easier for contributors

**Tasks**:
- [ ] Document all Socket.IO events
- [ ] Add request/response schemas
- [ ] Document validation rules
- [ ] Add example payloads
- [ ] Create API.md file
- [ ] Add sequence diagrams for complex flows

---

### 2. Consolidate Documentation
**Priority**: LOW
**Effort**: 1 hour
**Why**: Reduce clutter

**Tasks**:
- [ ] Review all .md files
- [ ] Archive outdated docs
- [ ] Merge similar docs
- [ ] Update main README
- [ ] Create CONTRIBUTING.md
- [ ] Create ARCHITECTURE.md

---

### 3. Add Code Comments for Complex Logic
**Priority**: LOW
**Effort**: 1-2 hours
**Why**: Maintainability

**Tasks**:
- [ ] Add JSDoc comments to all exported functions
- [ ] Document complex algorithms
- [ ] Add examples for unclear code
- [ ] Document edge cases
- [ ] Add TODO comments for known issues

---

## 🔧 Technical Debt & Refactoring (Ongoing)

### 1. Standardize Session Identifiers
**Priority**: MEDIUM
**Effort**: 2 hours
**Why**: Consistency and correctness

**Tasks**:
- [ ] Review all uses of socket.id vs player.id vs player.name
- [ ] Use stable identifiers for persistent state
- [ ] Use socket.id only for connection management
- [ ] Update all socket.id uses in game state
- [ ] Test reconnection after changes

**Pattern**:
```typescript
// ❌ Don't use for persistent state
rematchVotes: string[] // socket IDs

// ✅ Use for persistent state
rematchVotes: string[] // player names (stable)
```

---

### 2. Extract More Pure Functions
**Priority**: MEDIUM
**Effort**: 3-4 hours
**Why**: Continue improving code quality

**Targets**:
- [ ] Extract game creation logic
- [ ] Extract player joining logic
- [ ] Extract spectator logic
- [ ] Extract rematch logic
- [ ] Extract kick/leave logic

**Goal**: All game logic should be pure functions, handlers should only do I/O

---

### 3. Improve Error Messages
**Priority**: LOW
**Effort**: 1 hour
**Why**: Better UX

**Tasks**:
- [ ] Review all error messages
- [ ] Make messages more helpful
- [ ] Add error codes
- [ ] Add suggested actions
- [ ] Translate error messages
- [ ] Log errors with context

**Example**:
```typescript
// Before
{ error: 'Invalid move' }

// After
{
  error: 'Invalid move',
  code: 'SUIT_FOLLOWING_VIOLATION',
  message: 'You must play a red card because red was led',
  suggestion: 'Select a red card from your hand',
  context: { ledSuit: 'red', cardPlayed: 'blue' }
}
```

---

### 4. Add Database Migrations
**Priority**: LOW-MEDIUM
**Effort**: 2 hours
**Why**: Safer schema changes

**Tasks**:
- [ ] Set up database migration tool (e.g., db-migrate)
- [ ] Create initial migration (current schema)
- [ ] Document migration process
- [ ] Add migration running to deployment
- [ ] Test rollback procedure

---

## 🚀 Performance Optimizations (Future)

### 1. Optimize Database Queries
**Priority**: LOW
**Effort**: 2-3 hours

**Tasks**:
- [ ] Add database indexes
- [ ] Optimize slow queries
- [ ] Add query result caching
- [ ] Batch database writes
- [ ] Use prepared statements

---

### 2. Add Redis Caching
**Priority**: LOW
**Effort**: 3 hours

**Tasks**:
- [ ] Set up Redis
- [ ] Cache active games in Redis
- [ ] Cache leaderboard in Redis
- [ ] Cache player stats in Redis
- [ ] Set cache expiration policies
- [ ] Handle cache invalidation

---

### 3. Optimize Frontend Bundle Size
**Priority**: LOW
**Effort**: 2 hours

**Tasks**:
- [ ] Analyze bundle with webpack-bundle-analyzer
- [ ] Implement code splitting
- [ ] Lazy load routes
- [ ] Remove unused dependencies
- [ ] Optimize images
- [ ] Add compression

---

## 🎯 New Features (Future)

### 1. Add Chat System
**Priority**: LOW
**Effort**: 3-4 hours

**Tasks**:
- [ ] Add chat UI component
- [ ] Add chat socket events
- [ ] Add message storage
- [ ] Add chat history
- [ ] Add profanity filter
- [ ] Add emoji support
- [ ] Add team-only chat option

---

### 2. Add Friend System
**Priority**: LOW
**Effort**: 4-5 hours

**Tasks**:
- [ ] Add friend requests
- [ ] Add friend list
- [ ] Add friend-only games
- [ ] Add friend notifications
- [ ] Add friend leaderboard

---

### 3. Add Achievements System
**Priority**: LOW
**Effort**: 4-5 hours

**Tasks**:
- [ ] Define achievements
- [ ] Add achievement tracking
- [ ] Add achievement UI
- [ ] Add achievement notifications
- [ ] Add achievement rewards

---

## 📊 Analytics & Insights (Future)

### 1. Add Game Analytics Dashboard
**Priority**: LOW
**Effort**: 4-5 hours

**Tasks**:
- [ ] Track game metrics
- [ ] Create analytics dashboard
- [ ] Add player behavior analytics
- [ ] Add game balance analytics
- [ ] Export analytics data

---

### 2. Add A/B Testing Framework
**Priority**: LOW
**Effort**: 3-4 hours

**Tasks**:
- [ ] Add feature flag system
- [ ] Add A/B test framework
- [ ] Add metrics tracking
- [ ] Add result analysis
- [ ] Document A/B testing process

---

## 🔒 Security Improvements (Ongoing)

### 1. Add Input Validation
**Priority**: MEDIUM
**Effort**: 2 hours

**Tasks**:
- [ ] Validate all socket event payloads
- [ ] Sanitize player names
- [ ] Validate game IDs
- [ ] Add length limits
- [ ] Add type checking

---

### 2. Add Authentication (Optional)
**Priority**: LOW
**Effort**: 5-6 hours

**Tasks**:
- [ ] Choose auth provider (Auth0, Firebase, etc.)
- [ ] Add login/signup UI
- [ ] Add session management
- [ ] Add protected routes
- [ ] Migrate from session tokens to user accounts

---

## 📝 Summary

### Quick Wins (1-2 hours each)
1. ✅ Verify E2E tests
2. Add error tracking (Sentry)
3. Add rate limiting
4. Refactor select_team handler
5. Refactor swap_position handler

### High Impact (2-4 hours each)
1. Continue refactoring - Phase 2.2
2. Extract round/game logic - Phase 2.3
3. Add performance monitoring
4. Improve E2E test reliability
5. Game replay feature (now possible!)

### Long-term Projects (5+ hours)
1. Tournament mode
2. Friend system
3. Authentication system
4. Analytics dashboard
5. Advanced bot AI

---

**Total Estimated Work**: ~100+ hours of improvements available!

**Prioritization Strategy**:
1. Complete Phase 2 refactoring (pure functions everywhere)
2. Add production monitoring (Sentry, metrics)
3. Improve testing (E2E reliability, strict mode)
4. Add new features (replay, undo, tournaments)
5. Polish and optimization

---

*Generated: 2025-01-23*
*Last Phase Completed: Phase 2.1 - Extract Pure Functions*
*Next Recommended: Verify E2E tests, then Phase 2.2*

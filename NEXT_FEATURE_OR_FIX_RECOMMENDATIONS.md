# Next Feature & Fix Recommendations

**Generated:** 2025-10-25
**Version:** 1.0.5
**Status:** Post-Production Bug Fixes

Based on extensive codebase analysis and recent production issues, here are prioritized recommendations for the next phase of development.

---

## 🔴 Critical Priority - Stability & Data Integrity

### 1. **Automated Stale Game Cleanup**
**Priority:** High
**Effort:** Medium
**Impact:** Prevents database bloat and lobby clutter

**Problem:**
- Games that crash or are abandoned remain in the database indefinitely
- Old unfinished games clutter the lobby and cause "Game not found" errors
- No mechanism to detect and clean up orphaned games

**Solution:**
```typescript
// backend/src/index.ts
setInterval(async () => {
  const staleGames = await query(`
    SELECT game_id FROM game_history
    WHERE is_finished = FALSE
    AND updated_at < NOW() - INTERVAL '2 hours'
  `);

  for (const game of staleGames.rows) {
    // Mark as finished with special status
    await query(`UPDATE game_history SET is_finished = TRUE WHERE game_id = $1`, [game.game_id]);
    // Clean up from memory if exists
    games.delete(game.game_id);
  }
}, 3600000); // Run every hour
```

**Files to Modify:**
- `backend/src/index.ts` - Add cleanup interval
- `backend/src/db/index.ts` - Add `cleanupStaleGames()` function

---

### 2. **Game State Persistence & Recovery**
**Priority:** High
**Effort:** High
**Impact:** Players can rejoin crashed games

**Problem:**
- When server restarts, all in-memory game state is lost
- Players in active games are kicked out and lose progress
- No way to resume a game after a crash

**Solution:**
- Implement periodic game state snapshots to database
- Add game state restoration on server restart
- Emit `game_restored` event to reconnecting players

**Implementation:**
```typescript
// backend/src/db/gameState.ts
export const saveGameSnapshot = async (gameId: string, state: GameState) => {
  await query(`
    UPDATE game_history
    SET game_state_snapshot = $1, updated_at = NOW()
    WHERE game_id = $2 AND is_finished = FALSE
  `, [JSON.stringify(state), gameId]);
};

// Call every 30 seconds or on significant state changes
setInterval(() => {
  games.forEach((game, gameId) => {
    if (!game.isFinished) saveGameSnapshot(gameId, game);
  });
}, 30000);
```

**Files to Create/Modify:**
- `backend/src/db/schema.sql` - Add `game_state_snapshot JSONB` column
- `backend/src/db/gameState.ts` - Add snapshot functions
- `backend/src/index.ts` - Add server startup restoration logic

---

### 3. **Better Error Boundaries & Fallbacks**
**Priority:** Medium
**Effort:** Low
**Impact:** Prevents UI crashes from propagating

**Problem:**
- Runtime errors like the `playerName.push` crash cause entire app to freeze
- No graceful degradation when components fail
- Users see blank screens instead of error messages

**Solution:**
```typescript
// frontend/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

**Files to Create:**
- `frontend/src/components/ErrorBoundary.tsx`
- `frontend/src/components/ErrorFallback.tsx`
- Wrap `<App />` in `index.tsx`

---

## 🟡 High Priority - User Experience

### 4. **Real-Time Player Connection Status**
**Priority:** Medium
**Effort:** Low
**Impact:** Better awareness of network issues

**Current State:**
- Players disconnect silently
- 15-second grace period with no visual feedback
- Unclear when a player is reconnecting vs permanently gone

**Recommended:**
- Add visual indicator for disconnected players (grayed out avatar)
- Show "Reconnecting..." status during grace period
- Display countdown timer for reconnection window

**Files to Modify:**
- `frontend/src/components/TeamSelection.tsx`
- `frontend/src/components/BettingPhase.tsx`
- `frontend/src/components/PlayingPhase.tsx`
- `backend/src/index.ts` - Emit `player_connection_status` events

---

### 5. **Undo Last Action (Team Selection)**
**Priority:** Low
**Effort:** Low
**Impact:** Reduces frustration from misclicks

**Problem:**
- Players accidentally select wrong team
- Position swaps can be confusing
- No way to undo mistakes

**Solution:**
- Add "Undo" button visible for 3 seconds after action
- Store last action in state: `{ type: 'team_select', previousTeam: 1 }`
- Emit `undo_action` socket event

**Files to Modify:**
- `frontend/src/components/TeamSelection.tsx`
- `backend/src/index.ts` - Add `undo_action` handler

---

### 6. **Game Activity Feed**
**Priority:** Low
**Effort:** Medium
**Impact:** Better game awareness and engagement

**Concept:**
- Small scrollable feed showing recent actions:
  - "Alice joined Team 1"
  - "Bob placed bet: 10 points (without trump)"
  - "Charlie won trick (+5 points)"
  - "Team 1 scored: +12"

**Location:** Right sidebar during gameplay

**Files to Create:**
- `frontend/src/components/ActivityFeed.tsx`
- `frontend/src/utils/activityLogger.ts`

---

## 🟢 Feature Enhancements

### 7. **Configurable Game Rules**
**Priority:** Medium
**Effort:** High
**Impact:** Increases replayability and appeal to different player groups

**Customizable Settings:**
- **Winning Score:** 41, 51, 61 points (default: 41)
- **Round Timer:** Off, 30s, 60s, 90s per turn
- **Bot Difficulty Lock:** Prevent mid-game bot difficulty changes
- **Spectator Chat:** Enable/disable spectator messages
- **Auto-ready:** Automatically ready all players for next round

**Implementation:**
```typescript
interface GameSettings {
  winningScore: 41 | 51 | 61;
  turnTimer?: number; // seconds
  lockBotDifficulty: boolean;
  spectatorChat: boolean;
  autoReady: boolean;
}
```

**Files to Create/Modify:**
- `backend/src/types/game.ts` - Add `GameSettings` type
- `frontend/src/components/GameSettingsModal.tsx`
- `backend/src/game/state.ts` - Use settings in game logic

---

### 8. **Comprehensive Statistics Dashboard**
**Priority:** Medium
**Effort:** High
**Impact:** Player engagement and retention

**Statistics to Track:**
- **Win Rate by Team Position:** Which seat wins most often?
- **Betting Patterns:** Average bet, skip rate, without-trump success
- **Card Play Analysis:** Trump usage efficiency, suit distribution
- **Time-Based Metrics:** Peak play hours, average game duration
- **Matchup History:** Head-to-head records against other players

**Visualization:**
- Line charts for performance over time
- Heat maps for win rate by position
- Radar charts for playstyle analysis

**Files to Create:**
- `frontend/src/components/StatsDashboard.tsx`
- `frontend/src/components/charts/` - Chart components
- `backend/src/db/analytics.ts` - Advanced queries

---

### 9. **Tournament Mode**
**Priority:** Low
**Effort:** Very High
**Impact:** Competitive play and community building

**Features:**
- **Bracket System:** Single/double elimination
- **Swiss Format:** Everyone plays same number of rounds
- **Leaderboard:** Tournament-specific rankings
- **Tiebreakers:** Points differential, head-to-head
- **Spectator Mode:** Watch tournament games live
- **Prizes:** Badges, titles, profile customization

**Technical Challenges:**
- Multi-game state management
- Matchmaking algorithm
- Bracket visualization
- Prize system

---

## 🔵 Technical Debt & Code Quality

### 10. **Refactor Monolithic index.ts**
**Priority:** Medium
**Effort:** High
**Impact:** Code maintainability and developer velocity

**Current Issue:**
- `backend/src/index.ts` is 2,500+ lines
- Mixes concerns: routing, socket handling, game logic, database
- Difficult to navigate and test

**Proposed Structure:**
```
backend/src/
├── routes/
│   ├── api.ts          # REST endpoints
│   └── health.ts       # Health check
├── sockets/
│   ├── lobby.ts        # create_game, join_game, spectate
│   ├── team.ts         # select_team, swap_position
│   ├── betting.ts      # place_bet
│   ├── playing.ts      # play_card
│   └── chat.ts         # send_game_chat
├── services/
│   ├── gameService.ts  # Game CRUD operations
│   └── matchmaking.ts  # Bot replacement, player matching
└── middleware/
    ├── auth.ts         # Session validation
    └── rateLimit.ts    # Prevent spam
```

**Migration Strategy:**
- Extract one module at a time (start with chat)
- Keep backward compatibility
- Add comprehensive tests
- Update CLAUDE.md documentation

---

### 11. **Add Integration Tests**
**Priority:** Low
**Effort:** Medium
**Impact:** Catch regressions before production

**Current State:**
- 89 unit tests (good!)
- E2E tests exist but brittle
- No integration tests for API endpoints
- Socket events tested manually

**Recommended:**
```typescript
// backend/src/__tests__/integration/game-flow.test.ts
describe('Full game flow', () => {
  it('should complete a full game from creation to game over', async () => {
    const client1 = io(`http://localhost:${PORT}`);
    const client2 = io(`http://localhost:${PORT}`);

    // Create game
    const gameId = await new Promise(resolve => {
      client1.emit('create_game', 'Player1');
      client1.on('game_created', ({ gameId }) => resolve(gameId));
    });

    // Join game
    client2.emit('join_game', { gameId, playerName: 'Player2' });
    // ... complete game flow
  });
});
```

**Tools:** Jest + socket.io-client

---

### 12. **TypeScript Strict Mode**
**Priority:** Low
**Effort:** Medium
**Impact:** Better type safety, fewer bugs

**Current Config:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false,  // ← Change to true
    "strictNullChecks": false,  // ← Enable
    "strictFunctionTypes": false  // ← Enable
  }
}
```

**Expected Errors:** ~50-100 type issues to fix

**Benefits:**
- Catch null/undefined bugs at compile time
- Better IDE autocomplete
- Safer refactoring

---

## 📊 Monitoring & Analytics

### 13. **Application Monitoring (APM)**
**Priority:** Medium
**Effort:** Low
**Impact:** Proactive issue detection

**Recommended Tools:**
- **Sentry** - Error tracking and performance monitoring (Free tier: 5k errors/month)
- **LogRocket** - Session replay for debugging user issues
- **Prometheus + Grafana** - Self-hosted metrics (free)

**Key Metrics to Track:**
- Error rate by endpoint/event
- Average game duration
- Player retention (daily/weekly active users)
- Database query performance
- WebSocket connection stability

**Implementation:**
```typescript
// backend/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });

// Automatic error capture
app.use(Sentry.Handlers.errorHandler());
```

---

### 14. **Database Indexing & Query Optimization**
**Priority:** Medium
**Effort:** Low
**Impact:** Faster queries, better scalability

**Missing Indexes:**
```sql
-- backend/src/db/schema.sql
CREATE INDEX idx_game_history_finished ON game_history(is_finished, created_at);
CREATE INDEX idx_game_participants_player ON game_participants(player_name);
CREATE INDEX idx_player_stats_elo ON player_stats(elo DESC);
```

**Slow Queries to Optimize:**
- Leaderboard query (current: full table scan)
- Player history with JOINs (consider denormalization)
- Active games filtering

**Tool:** `EXPLAIN ANALYZE` to identify bottlenecks

---

## 🎨 UI/UX Polish

### 15. **Accessibility (WCAG 2.1 AA Compliance)**
**Priority:** Low
**Effort:** Medium
**Impact:** Inclusive design, legal compliance

**Current Issues:**
- Missing ARIA labels on interactive elements
- Color contrast too low in dark mode (some text)
- No keyboard navigation for modals
- Screen readers can't announce game state changes

**Quick Wins:**
```tsx
// Add ARIA labels
<button aria-label="Place bet: 10 points">Place Bet</button>

// Announce dynamic changes
<div role="status" aria-live="polite">
  {gameState.phase === 'betting' && 'Betting phase started'}
</div>

// Keyboard navigation
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, []);
```

**Files:** All component files

---

### 16. **Mobile Optimization**
**Priority:** Medium
**Effort:** Medium
**Impact:** Better mobile experience

**Current Issues:**
- Cards too small on phones (<375px width)
- Modals sometimes overflow viewport
- Team selection cramped on small screens
- Chat panel covers game area

**Solutions:**
- Use CSS Grid for responsive layouts
- Add bottom sheet for mobile modals
- Implement swipe gestures for card selection
- Collapsible chat on mobile

**Test Devices:** iPhone SE, Android small (360px)

---

## 🛡️ Security & Privacy

### 17. **Rate Limiting & Anti-Spam**
**Priority:** High
**Effort:** Low
**Impact:** Prevent abuse and DoS attacks

**Vulnerabilities:**
- Unlimited socket event emissions (spam bets, chat flood)
- No protection against bot accounts
- Game creation spam

**Solution:**
```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

app.use('/api/', apiLimiter);

// Socket.io rate limiting
const chatLimiter = new Map(); // socketId -> last message time
socket.on('send_game_chat', ({ message }) => {
  const lastMessage = chatLimiter.get(socket.id);
  if (lastMessage && Date.now() - lastMessage < 1000) {
    socket.emit('error', { message: 'Slow down! Wait 1 second between messages' });
    return;
  }
  chatLimiter.set(socket.id, Date.now());
  // ... process message
});
```

---

### 18. **Input Sanitization & Validation**
**Priority:** High
**Effort:** Low
**Impact:** Prevent XSS and injection attacks

**Current Risks:**
- Player names not sanitized (potential XSS)
- Chat messages not escaped
- No validation on bet amounts (could send negative values)

**Solution:**
```typescript
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Sanitize player names
const sanitizeName = (name: string): string => {
  return DOMPurify.sanitize(validator.escape(name.trim()));
};

// Validate bet amount
const isValidBet = (amount: number): boolean => {
  return Number.isInteger(amount) && amount >= 7 && amount <= 12;
};
```

---

## 📝 Summary & Prioritization Matrix

| Feature | Priority | Effort | Impact | Recommended Order |
|---------|----------|--------|--------|-------------------|
| Stale Game Cleanup | 🔴 High | Medium | High | **1** |
| Rate Limiting | 🔴 High | Low | High | **2** |
| Input Sanitization | 🔴 High | Low | High | **3** |
| Game State Persistence | 🔴 High | High | High | **4** |
| Error Boundaries | 🟡 Medium | Low | Medium | **5** |
| Connection Status | 🟡 Medium | Low | Medium | **6** |
| Database Indexing | 🟡 Medium | Low | High | **7** |
| Refactor index.ts | 🟡 Medium | High | Medium | **8** |
| Configurable Rules | 🟡 Medium | High | High | **9** |
| Statistics Dashboard | 🟡 Medium | High | Medium | **10** |
| APM Integration | 🟡 Medium | Low | Medium | **11** |
| Mobile Optimization | 🟡 Medium | Medium | Medium | **12** |
| Activity Feed | 🟢 Low | Medium | Low | **13** |
| Undo Action | 🟢 Low | Low | Low | **14** |
| Accessibility | 🟢 Low | Medium | Medium | **15** |
| TypeScript Strict | 🟢 Low | Medium | Medium | **16** |
| Integration Tests | 🟢 Low | Medium | Low | **17** |
| Tournament Mode | 🟢 Low | Very High | High | **18** |

---

## 🚀 Recommended Next Sprint (2 weeks)

**Week 1:**
1. Stale game cleanup system (2 days)
2. Rate limiting & anti-spam (1 day)
3. Input sanitization (1 day)
4. Database indexing (0.5 days)
5. Error boundaries (0.5 days)

**Week 2:**
1. Game state persistence (3 days)
2. Connection status indicators (1 day)
3. Mobile optimization fixes (1 day)

**Expected Outcome:** More stable, secure, and performant production app

---

## 📚 Additional Resources

- **Performance:** [Web Vitals](https://web.dev/vitals/)
- **Security:** [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- **Accessibility:** [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **TypeScript:** [Strict Mode Migration](https://www.typescriptlang.org/tsconfig#strict)

---

*This document is a living recommendation list. Priorities may shift based on user feedback and production metrics.*

**Version:** 1.0
**Last Updated:** 2025-10-25
**Next Review:** After implementing top 5 items

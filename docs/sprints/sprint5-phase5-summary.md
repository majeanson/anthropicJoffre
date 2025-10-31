# Sprint 5 - Phase 5: E2E Test Refactoring

**Date**: October 2025
**Status**: In Progress
**Goal**: Refactor or remove all skipped E2E tests to achieve 100% test suite health

## Background

The E2E test suite contains several skipped tests due to architectural limitations with multi-page/multi-context Playwright tests. These tests either crash browsers after ~60s of runtime or test features that don't exist in the current UI implementation.

**Root Cause**: Multi-page architecture (using `context.newPage()` or multiple browser contexts) is unstable for long-running tests and causes browser crashes.

**Solution**: Refactor tests to use **Quick Play + Autoplay** single-page architecture with server-side bots.

---

## Skipped Tests Inventory

### 1. Marathon Game Flow Tests (Multi-page crashes)

**Files**:
- `24-game-flow-1-player-3-bots.spec.ts` - Entire suite skipped
- `25-game-flow-2-players-2-bots.spec.ts` - Entire suite skipped
- `26-game-flow-full-length.spec.ts` - Entire suite skipped
- `23-game-flow-4-players.spec.ts` - Partial (nested describe.skip for full-length games)

**Issue**: Uses `createGameWithBots()` or multi-page setup which creates multiple browser pages/contexts. Crashes after ~60s in marathon scenarios.

**Refactoring Strategy**: ✅ **Already Started**
- New file: `27-marathon-automated.spec.ts` uses Quick Play + Autoplay
- Benefits:
  - Single browser page (no multi-page overhead)
  - Server-side bots (more efficient)
  - Autoplay for human player (no manual intervention)
  - Memory efficient (runs 60+ minutes without issues)

**Test Coverage**:
- ✅ 15-round game completion (20 min timeout)
- ✅ Full game from 0-0 to 41+ (60 min timeout)
- ✅ Memory leak detection (30 min, 20 rounds)
- ✅ Performance regression testing (20 min, 15 rounds)

**Action Items**:
1. ✅ Created 27-marathon-automated.spec.ts with 4 stable tests
2. 🔲 Remove obsolete multi-page marathon tests (24, 25, 26)
3. 🔲 Un-skip nested describe.skip in 23-game-flow-4-players.spec.ts

---

### 2. Spectator Mode Tests

**File**: `14-spectator.spec.ts` - Entire suite skipped (3 tests)

**Tests**:
1. Should allow joining game as spectator
2. Should hide player hands from spectators
3. Should show game state to spectators (scores, tricks, current player)

**Issue**: Uses `context.newPage()` to create spectator page alongside player page. Multi-page instability causes crashes.

**Refactoring Strategy**:
- **Option A** (Recommended): Use Quick Play for player, separate browser instance for spectator
  - Quick Play creates game with bots
  - New browser instance (not context) joins as spectator
  - More isolated, less crash-prone

- **Option B**: Accept as known limitation
  - Document that spectator tests require multi-page setup
  - Run manually or in isolation
  - Keep skipped with detailed explanation

**Action Items**:
1. 🔲 Attempt Option A refactoring
2. 🔲 If unstable, choose Option B and document

---

### 3. Timeout System Tests

**Files**:
- `15-timeout-system.spec.ts` - Entire suite skipped (3 tests)
- `19-timeout-autoplay.spec.ts` - Entire suite skipped (5+ tests)

**Tests**:
- Timeout indicators in betting/playing phases
- Auto-skip after timeout in betting
- Auto-play after timeout in playing
- Timeout system with bots

**Issue**: Requires multiple real players for timeout observation, uses `createGameWith4Players()` multi-page setup. Also, timeout tests are slow (60s+ waits).

**Refactoring Strategy**:
- **Option A**: Use Quick Play + inspect timeout behavior on single page
  - Human player can observe their own timeout indicator
  - Verify bot auto-actions (bots don't have timeouts, but system should work)

- **Option B**: Test via API/backend unit tests instead
  - Timeout logic is server-side
  - Can be tested without E2E overhead
  - Faster and more reliable

- **Option C**: Use 2 separate browser instances (not contexts)
  - One Quick Play game (with bots)
  - One real player joins via separate browser
  - Observe timeout behavior
  - Still slower but more isolated than contexts

**Action Items**:
1. 🔲 Review timeout implementation in backend
2. 🔲 Choose refactoring approach (likely Option A + B hybrid)
3. 🔲 Refactor or move to backend unit tests

---

### 4. Chat System Tests

**File**: `20-chat-system.spec.ts` - 7 individual tests skipped

**Tests and Issues**:

| Test | Reason Skipped | Action |
|------|----------------|--------|
| Should open and close chat panel | Feature not in team selection (inline chat) | 🔲 **Remove** - Not applicable |
| Should show unread message counter | No unread counter in team selection | 🔲 **Remove** - Not applicable |
| Should support quick emoji reactions | No emoji buttons in team selection | 🔲 **Remove** - Not applicable |
| Should persist chat messages across game phases | Separate chat systems (team selection vs game) | 🔲 **Remove** - Not applicable unless feature added |
| Should show chat in betting phase | Browser crashes (multi-context + multi-page) | 🔲 **Refactor** - Use Quick Play approach |
| Should handle rapid message sending | Timing/flakiness issues with input clearing | 🔲 **Fix** - Better wait strategies |
| (Implicit tests for game phase chat) | Need to progress through phases | 🔲 **Refactor** - Use Quick Play + advance to betting |

**Refactoring Strategy**:
1. **Remove non-applicable tests**: Tests expecting features that don't exist
   - Chat panel toggle (team selection has inline chat)
   - Unread counters (always visible in team selection)
   - Quick emoji buttons (not in team selection UI)
   - Message persistence across phases (intentionally separate systems)

2. **Refactor applicable tests**: Use Quick Play to reach betting/playing phases
   - Chat visibility in betting phase
   - Chat functionality during gameplay
   - Team indicators on messages

3. **Fix flaky tests**: Better wait strategies for rapid messaging
   - Wait for input to be ready after send
   - Use proper assertions instead of timing

**Action Items**:
1. 🔲 Remove 4 non-applicable tests (document in code comments)
2. 🔲 Refactor 2 tests to use Quick Play
3. 🔲 Fix timing issues in 1 test

---

### 5. Playing Phase Test

**File**: `03-playing.spec.ts` - 1 test skipped

**Test**: "Should show player info (cards left, tricks won)"

**Issue**: Feature doesn't exist in UI. Game shows team scores and round points instead of individual player card counts or tricks won.

**Refactoring Strategy**: **Remove** - This is testing for a feature that was never implemented and is not part of the current UI design.

**Action Items**:
1. 🔲 Remove test entirely (not just skip)
2. 🔲 Document in FEATURES.md that individual player stats are not displayed during gameplay

---

## Phase 5 Refactoring Plan

### Priority 1: Clean Up Non-Applicable Tests (Quick Wins)

**Estimated Time**: 30 minutes

1. ✅ Document all skipped tests and reasons
2. 🔲 Remove `03-playing.spec.ts` skipped test (player info display)
3. 🔲 Remove 4 non-applicable chat tests from `20-chat-system.spec.ts`:
   - Chat panel open/close
   - Unread counter
   - Quick emoji reactions
   - Message persistence across phases
4. 🔲 Add code comments explaining why these features don't exist

### Priority 2: Consolidate Marathon Tests

**Estimated Time**: 1 hour

1. ✅ Verify `27-marathon-automated.spec.ts` tests pass
2. 🔲 Run marathon tests to confirm stability (npx playwright test --grep @marathon)
3. 🔲 Remove obsolete marathon test files:
   - Delete `24-game-flow-1-player-3-bots.spec.ts`
   - Delete `25-game-flow-2-players-2-bots.spec.ts`
   - Delete `26-game-flow-full-length.spec.ts`
4. 🔲 Un-skip and refactor `23-game-flow-4-players.spec.ts` nested describe
5. 🔲 Update README.md and CLAUDE.md to reference new marathon test file

### Priority 3: Refactor Chat System Tests

**Estimated Time**: 1-2 hours

1. 🔲 Remove non-applicable tests (see Priority 1)
2. 🔲 Create new test: "Should show chat in betting phase" using Quick Play
   ```typescript
   test('should show chat in betting phase', async ({ browser }) => {
     const result = await createQuickPlayGame(browser);
     const page = result.pages[0];

     // Verify chat toggle exists in betting phase
     const chatToggle = page.getByTestId('chat-toggle-button');
     await expect(chatToggle).toBeVisible();

     // Open chat and send message
     await chatToggle.click();
     // ... test chat functionality
   });
   ```
3. 🔲 Fix rapid message sending test with better wait strategies
4. 🔲 Add test for emoji functionality in game phases (not team selection)

### Priority 4: Refactor Spectator Tests

**Estimated Time**: 2-3 hours

1. 🔲 Attempt Quick Play + separate browser instance approach:
   ```typescript
   test('should allow joining game as spectator', async ({ browser }) => {
     // Player creates Quick Play game
     const playerResult = await createQuickPlayGame(browser);
     const gameId = playerResult.gameId;

     // Spectator joins via SEPARATE browser instance
     const spectatorBrowser = await playwright.chromium.launch();
     const spectatorContext = await spectatorBrowser.newContext();
     const spectatorPage = await spectatorContext.newPage();

     // Join as spectator...
     await spectatorPage.goto('/');
     // ... rest of test

     // Cleanup
     await spectatorBrowser.close();
   });
   ```
2. 🔲 If unstable, document as known limitation and keep skipped
3. 🔲 Consider testing spectator mode via API/backend unit tests instead

### Priority 5: Refactor or Archive Timeout Tests

**Estimated Time**: 2-4 hours

1. 🔲 Analyze timeout implementation in backend (`backend/src/utils/timeoutManager.ts`)
2. 🔲 Determine if timeout logic can be tested via backend unit tests
3. 🔲 If E2E needed, refactor to use Quick Play + single page observation
4. 🔲 Consider moving timeout tests to backend test suite instead
5. 🔲 If kept as E2E, document that they're slow tests (@slow tag)

---

## Success Criteria

- ✅ All skipped tests are either:
  1. Refactored and passing, OR
  2. Removed with documentation explaining why, OR
  3. Moved to backend unit tests

- ✅ No `test.skip` or `test.describe.skip` in codebase except:
  - Tests explicitly marked as `@manual` (require manual intervention)
  - Tests explicitly marked as `@slow` with documented reasons

- ✅ Marathon tests run successfully for 60+ minutes without crashes

- ✅ Test suite health: 100% of non-@manual tests are runnable

---

## Architecture Decisions

### Why Quick Play + Autoplay?

**Before** (Multi-page):
```typescript
const contexts = [context1, context2, context3, context4];
const pages = [page1, page2, page3, page4]; // 4 browser pages
// Each page has own memory, own rendering, own JavaScript heap
// Browser crashes after ~60s with 4+ pages open
```

**After** (Quick Play):
```typescript
const page = await browser.newPage(); // Single page
await page.getByTestId('quick-play-button').click(); // 3 server-side bots
await page.getByTestId('autoplay-toggle').click(); // Autoplay for human
// Server handles bot logic, single browser page, runs 60+ minutes
```

**Benefits**:
1. **Stability**: Single page = no multi-page overhead or memory issues
2. **Speed**: Server-side bots are faster than browser-based bots
3. **Simplicity**: No complex page synchronization or context management
4. **Realistic**: Tests actual Quick Play feature that real users use
5. **Scalability**: Can run multiple tests in parallel without browser crashes

### When to Use Multi-page Tests?

**Never for marathon/long-running tests**. Only for:
1. Short, focused tests (< 30 seconds)
2. Features that absolutely require multiple real players (e.g., real-time synchronization)
3. Tests that can't be accomplished with Quick Play + bots

**Even then**, prefer:
1. Backend unit tests for logic
2. Single-page E2E with Quick Play for UI
3. API-level tests for state synchronization

---

## Helper Functions Reference

### Available Helpers

| Function | Use Case | Architecture |
|----------|----------|--------------|
| `createGameWith4Players()` | Multi-player coordination tests | Multi-page (4 pages) - avoid for long tests |
| `createQuickPlayGame()` | Stable single-player tests | Single page + 3 server bots |
| `createAutomatedMarathonGame()` | Marathon/stability tests | Quick Play + Autoplay |
| `monitorMarathonGame()` | Long-running game monitoring | Metrics collection over time |
| `verifyGameState()` | State assertions | Works with any architecture |
| `createGameWithBots()` | Bot behavior tests | Multi-page - being phased out |

### Recommended Patterns

**For Short Tests (< 30s)**:
```typescript
// Multi-page is OK for short tests
const result = await createGameWith4Players(browser);
```

**For Medium Tests (30s - 5min)**:
```typescript
// Prefer Quick Play for stability
const result = await createQuickPlayGame(browser, { difficulty: 'hard' });
```

**For Marathon Tests (5min+)**:
```typescript
// Use automated marathon for hands-off testing
const result = await createAutomatedMarathonGame(browser, {
  difficulty: 'hard',
  targetRounds: 20
});
const metrics = await monitorMarathonGame(result.page, {
  maxRounds: 20,
  collectMetrics: true
});
```

---

## Timeline

**Week 1**: Priority 1 & 2 (Clean up + Consolidate marathon tests)
**Week 2**: Priority 3 (Chat system refactoring)
**Week 3**: Priority 4 & 5 (Spectator and timeout tests)
**Week 4**: Final verification and documentation

---

## Related Documentation

- **TESTING_ARCHITECTURE.md** - Overall testing strategy
- **TDD_WORKFLOW.md** - Test-driven development workflow
- **FEATURES.md** - Feature documentation (for non-applicable test reference)
- **CLAUDE.md** - Main development guide

---

**Last Updated**: 2025-10-31
**Status**: Phase 5 in progress - starting with Priority 1

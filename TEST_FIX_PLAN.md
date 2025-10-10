# E2E Test Fix Plan

## Test Execution Status
Currently running full test suite. Results will be analyzed once complete.

## Initial Analysis (Based on Partial Results)

### Common Failure Patterns Identified

1. **Game ID Extraction** ✅ **CONFIRMED WORKING**
   - Tests use `.font-mono` class selector
   - Class exists in TeamSelection.tsx line 49
   - **Status**: This pattern is correct

2. **Player Joining Issues** ⚠️ **NEEDS INVESTIGATION**
   - Error contexts show "Players (1/4)" stuck at team selection
   - Tests expect 4 players but only creator joins
   - **Hypothesis**: Timing issue with socket connections or slow joins

3. **Timeout Issues** ⚠️ **NEEDS INVESTIGATION**
   - Tests timing out at 60s (default Playwright timeout)
   - Suggests async operations not completing
   - Common in: 01-lobby, 02-betting tests

### Test Files Analysis

#### ✅ 01-lobby.spec.ts - Appears Correct
```typescript
// Line 51: Game ID extraction
await page1.waitForSelector('.font-mono', { timeout: 10000 });
const gameIdElement = page1.locator('.font-mono');
const gameId = await gameIdElement.textContent();
```
**Status**: Code looks correct. Failure likely due to slow backend or socket issues.

#### ✅ helpers.ts - Appears Correct
```typescript
// Line 24: Same pattern
await page.waitForSelector('.font-mono', { timeout: 10000 });
const gameIdElement = page.locator('.font-mono');
gameId = await gameIdElement.textContent();
```
**Status**: Helper functions use same correct pattern.

#### 🔄 14-spectator.spec.ts - Recently Fixed
```typescript
// Line 16-21: Uses localStorage instead of UI
gameId = await playerPage.evaluate(() => {
  const session = localStorage.getItem('gameSession');
  return session ? JSON.parse(session).gameId : '';
});
```
**Status**: Different approach (localStorage) - this might be more reliable.

## Root Cause Hypotheses

### Hypothesis 1: Socket Connection Timing
**Symptoms**:
- Players not joining games
- Tests stuck at team selection
- Only 1/4 players shown

**Possible Causes**:
- Backend server not fully started before tests run
- Socket.io connections failing silently
- Race condition in Quick Play bot spawning

**Evidence Needed**:
- Check if backend is ready before tests start
- Add logging to socket connection events
- Verify `webServer` config in playwright.config.ts

### Hypothesis 2: Playwright WebServer Not Ready
**Symptoms**:
- Timeouts on first test
- Subsequent tests also fail

**Possible Causes**:
- `webServer.timeout` too short
- `webServer.reuseExistingServer` not working
- Port already in use

**Evidence Needed**:
- Check playwright.config.ts webServer settings
- Check if port 3001 (backend) and 5173 (frontend) are available
- Verify server startup logs

### Hypothesis 3: Test Infrastructure Issues
**Symptoms**:
- Cascading failures across all test suites

**Possible Causes**:
- Shared state between tests not cleaned up
- Browser context reuse issues
- Database/memory leaks

**Evidence Needed**:
- Check if tests are properly isolated
- Verify `beforeEach`/`afterEach` cleanup
- Check memory/game state cleanup between tests

## Fix Strategy (Priority Order)

### Phase 1: Verify Infrastructure ⏳ IN PROGRESS
- [ ] Wait for full test run to complete
- [ ] Analyze all error-context.md files
- [ ] Check playwright-report for summary statistics
- [ ] Identify most common failure type

### Phase 2: Fix WebServer Configuration
- [ ] Check `e2e/playwright.config.ts` webServer settings
- [ ] Increase `webServer.timeout` if needed (current: ?)
- [ ] Add `webServer.stdout: 'pipe'` for debugging
- [ ] Verify `reuseExistingServer: true` to speed up tests

### Phase 3: Fix Test Timing Issues
- [ ] Add longer waits for socket connections (currently 500ms)
- [ ] Use `page.waitForResponse()` instead of arbitrary timeouts
- [ ] Add retry logic for flaky socket operations
- [ ] Increase specific test timeouts where needed

### Phase 4: Fix Individual Test Suites
1. **01-lobby.spec.ts** - Foundation tests
   - These must pass first
   - Fix any game creation/joining issues

2. **02-betting.spec.ts** - Depends on lobby
   - Requires 4 players to join successfully
   - Fix after 01-lobby passes

3. **03-playing.spec.ts** - Depends on betting
   - Requires betting phase to complete
   - Fix after 02-betting passes

4. **04-game-flow.spec.ts** - Integration test
   - Tests full game flow
   - Fix after 01-03 pass

5. **05-skip-bet.spec.ts, 06-validation.spec.ts** - Specific features
   - Fix after core tests pass

6. **14-spectator.spec.ts** - New feature
   - Already updated with localStorage approach
   - May still have issues with game setup

### Phase 5: Optimize Test Performance
- [ ] Reduce unnecessary `waitForTimeout()` calls
- [ ] Use `Promise.all()` for parallel operations
- [ ] Implement test fixtures for common setups
- [ ] Add test retries for truly flaky tests

## Key Files to Review

1. `e2e/playwright.config.ts` - WebServer config
2. `e2e/tests/helpers.ts` - Shared test utilities
3. `backend/src/index.ts` - Socket.io server startup
4. `frontend/src/App.tsx` - Socket.io client connection

## Success Criteria

- [ ] All 01-lobby tests pass (foundation)
- [ ] All 02-betting tests pass (core gameplay)
- [ ] All 03-playing tests pass (core gameplay)
- [ ] All 04-game-flow tests pass (integration)
- [ ] All validation tests pass (05, 06)
- [ ] All spectator tests pass (14)
- [ ] Test suite completes in <5 minutes
- [ ] No flaky tests (all pass consistently)

## Notes

- The `.font-mono` selector is **correct** and exists in the code
- The real issue is likely **timing/socket connections**
- Need full test results before making changes
- Should avoid cargo-cult fixes without understanding root cause

---

*Created: 2025-10-09*
*Status: Awaiting full test results*

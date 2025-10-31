# Test Run Analysis - 2025-10-29_22-15-26

## Critical Findings

### Overall Results
- **131 FAILED** (84.5%)
- **18 SKIPPED** (11.6%)
- **6 PASSED** (3.9%)
- **Total**: 155 tests
- **Duration**: 22.6 minutes

### Root Cause: Game Creation Failure

**Primary Issue**: The `game-id` test ID element is not appearing after game creation, causing cascading failures across the entire test suite.

**Error Pattern**:
```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for getByTestId('game-id') to be visible

at helpers.ts:30 (createGameWith4Players)
```

**Impact**: ~120+ tests fail at the very first step (game creation)

### Possible Causes

1. **Backend Server Not Running**
   - Tests may have started before server was ready
   - Server may have crashed early in test run
   - Port conflicts

2. **UI Changes to Team Selection**
   - Game ID display location changed
   - Test ID removed or renamed
   - Auto-team-assignment broke ID display

3. **Browser/Context Issues**
   - Multi-context setup causing race conditions
   - Browser crashed and tests continued
   - Session storage not working properly

4. **Test Helper Function Bug**
   - `createGameWith4Players()` in helpers.ts has a bug
   - Timeout too short (10s)
   - Wrong selector or wait condition

### Tests That Actually Passed (6)

Need to identify which 6 tests passed to understand what's different about them:
- Likely tests that don't use `createGameWith4Players()`
- Tests that create games differently
- Tests that don't require game creation

### Recommended Next Steps

1. **Verify Backend Server**
   ```bash
   # Check if server is running
   curl http://localhost:3000/api/health
   
   # Check server logs for errors
   ```

2. **Check Team Selection UI**
   - Manually test game creation in browser
   - Verify game-id test ID still exists
   - Check if team selection phase shows game ID

3. **Test Helper Function**
   - Add more logging to createGameWith4Players()
   - Increase timeout from 10s to 30s
   - Add screenshot capture on failure

4. **Run Single Test Manually**
   ```bash
   cd e2e
   npx playwright test tests/01-lobby.spec.ts:24 --headed
   # This will show exactly what's failing
   ```

5. **Check for Breaking Changes**
   - Recent commits that changed team selection
   - Changes to game ID display logic
   - Backend API changes

### Files to Investigate

1. `e2e/tests/helpers.ts:30` - createGameWith4Players()
2. `frontend/src/components/TeamSelection.tsx` - Game ID display
3. `backend/src/index.ts` - Game creation logic
4. Recent git commits affecting team selection

### Test Categories

**Critical (Must Fix First)**:
- Game creation in helpers.ts
- Backend server stability
- Team selection game ID display

**High Priority**:
- Lobby tests (01-lobby.spec.ts)
- Basic game flow tests

**Medium Priority**:
- Betting/Playing phase tests (depend on game creation working)

**Low Priority**:
- Marathon/stress tests
- Network resilience tests

---

**Next Action**: Manually run a single test with `--headed` flag to visually see what's failing.

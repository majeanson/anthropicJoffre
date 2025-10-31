# E2E Test Stability Guide

**Last Updated:** 2025-10-31
**Status:** Active - Sprint 1 Stability Improvements

---

## 🎯 Overview

This guide documents strategies for maintaining stable E2E tests, addressing known flakiness issues, and providing best practices for writing reliable tests.

---

## 📊 Current Status

### Stable Tests
- ✅ Lobby tests (01-lobby.spec.ts) - 5/5 passing
- ✅ Betting tests (02-betting.spec.ts) - 9/9 passing
- ✅ Playing tests (03-playing.spec.ts)
- ✅ Validation tests (06-validation.spec.ts)
- ✅ Basic reconnection tests (09-reconnection-simple.spec.ts)

### Known Issues
- ⚠️ Marathon tests (26-game-flow-full-length.spec.ts) - Browser crashes after ~60s
- ⚠️ Multi-context tests - Architectural limitation with long gameplay
- ⚠️ Memory pressure during extended gameplay (10+ rounds)

### Improvements (2025-10-31)
- ✅ Default timeout increased: 60s → 120s
- ✅ Action timeout increased: 15s → 20s
- ✅ Navigation timeout increased: 30s → 40s
- ✅ Expect timeout: 5s → 10s
- ✅ Local retries enabled: 0 → 1
- ✅ Stability helpers library created

---

## 🛠️ Stability Helpers

**Location:** `e2e/tests/helpers-stability.ts`

### Key Features

#### 1. Retry Logic with Exponential Backoff

```typescript
import { retryWithBackoff } from './helpers-stability';

// Retry any operation automatically
await retryWithBackoff(
  async () => {
    await page.click('[data-testid="start-game-button"]');
  },
  {
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5000,
    timeoutMs: 15000,
  },
  'click start game button'
);
```

**When to use**: Operations that might fail due to timing issues (detached elements, loading states, etc.)

#### 2. Stable Element Interactions

```typescript
import {
  waitForElementStable,
  clickElementStable,
  fillInputStable,
  getTextContentStable,
} from './helpers-stability';

// Wait for element with automatic retries
await waitForElementStable(page, '[data-testid="betting-phase"]', {
  timeout: 10000,
  state: 'visible',
});

// Click with retry (handles detached elements)
await clickElementStable(page, '[data-testid="place-bet-button"]');

// Fill input with retry
await fillInputStable(page, '[data-testid="player-name"]', 'Player 1');

// Get text with retry
const gameId = await getTextContentStable(page, '[data-testid="game-id"]');
```

**Benefits:**
- Automatically retries on "element detached" errors
- Handles race conditions
- Better error messages with operation names

#### 3. Condition-Based Waiting

```typescript
import { waitForCondition } from './helpers-stability';

// Wait for specific condition (better than arbitrary timeouts)
await waitForCondition(
  async () => {
    const text = await page.textContent('[data-testid="status"]');
    return text === 'Ready';
  },
  {
    timeout: 10000,
    pollInterval: 200,
    errorMessage: 'Game never reached ready state',
  }
);
```

**Why better than `waitForTimeout`:**
- Exits immediately when condition is met (faster tests)
- Clear error messages
- No arbitrary delays

#### 4. Page and Context Cleanup

```typescript
import { cleanupPage, cleanupContext, cleanupMultipleContexts } from './helpers-stability';

test.afterEach(async ({ context }) => {
  // Clean up single context
  await cleanupContext(context);
});

test.afterEach(async () => {
  // Clean up multiple contexts (for multi-player tests)
  await cleanupMultipleContexts([context1, context2, context3, context4]);
});
```

**What it does:**
- Cancels pending network requests
- Clears resource timing
- Closes all pages
- Prevents memory leaks

#### 5. Game-Specific Helpers

```typescript
import { waitForGamePhase, waitForPlayerTurn } from './helpers-stability';

// Wait for specific game phase
await waitForGamePhase(page, 'Betting Phase', { timeout: 15000 });

// Wait for player's turn
await waitForPlayerTurn(page, 'Player 1', { timeout: 10000 });
```

#### 6. Performance Monitoring

```typescript
import { collectMetrics, logMetrics, getMemoryUsage } from './helpers-stability';

// Collect performance metrics
const metrics = await collectMetrics(context);
logMetrics(metrics, 'Round 5');
// Output: [Round 5] Memory: 125MB, Pages: 4, Time: 2025-10-31T...

// Monitor memory during long tests
const beforeMemory = await getMemoryUsage(page);
// ... perform operations ...
const afterMemory = await getMemoryUsage(page);
console.log(`Memory delta: ${afterMemory - beforeMemory} bytes`);
```

---

## ✅ Best Practices

### 1. Use Test IDs (NOT text selectors)

```typescript
// ✅ GOOD - Stable, language-independent
await page.getByTestId('create-game-button').click();

// ❌ BAD - Breaks if text changes
await page.getByText('Create Game').click();
```

### 2. Avoid Arbitrary Timeouts

```typescript
// ❌ BAD - Always waits 2 seconds, even if ready sooner
await page.waitForTimeout(2000);
const text = await page.textContent('[data-testid="status"]');

// ✅ GOOD - Exits immediately when condition is met
await waitForCondition(async () => {
  const text = await page.textContent('[data-testid="status"]');
  return text === 'Ready';
}, { timeout: 2000 });
```

### 3. Wait for Network Idle

```typescript
import { waitForNetworkIdle } from './helpers-stability';

// Before checking game state after action
await page.click('[data-testid="place-bet-button"]');
await waitForNetworkIdle(page, { timeout: 5000 });
// Now safe to verify game state
```

### 4. Clean Up After Each Test

```typescript
let context: any;

test.afterEach(async () => {
  if (context) {
    await cleanupContext(context);
  }
});
```

### 5. Use Retries for Flaky Operations

```typescript
// Operations that might fail due to timing
await retryWithBackoff(
  async () => {
    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    if (currentPlayerIndex === -1) throw new Error('No player found');
    return currentPlayerIndex;
  },
  { maxAttempts: 5, initialDelay: 300 },
  'find current player'
);
```

---

## 🚨 Common Issues and Solutions

### Issue 1: "Element detached from DOM"

**Cause**: React re-renders between locator creation and action

**Solution**: Use `clickElementStable` or wrap in retry

```typescript
// Instead of:
await page.click('[data-testid="button"]');

// Use:
await clickElementStable(page, '[data-testid="button"]');
```

### Issue 2: "Timeout waiting for selector"

**Cause**: Element not yet rendered or hidden by loading state

**Solution**: Increase timeout or use `waitForElementStable`

```typescript
await waitForElementStable(page, '[data-testid="element"]', {
  timeout: 20000, // Longer timeout
  state: 'visible',
});
```

### Issue 3: Browser Crashes (Marathon Tests)

**Cause**: Memory pressure from 4 open pages over 60+ seconds

**Solutions:**
1. Use segmented architecture (close/reopen contexts between rounds)
2. Use Quick Play + bots instead of 4 real players
3. Add periodic cleanup

```typescript
// Segmented approach
for (let segment = 0; segment < totalSegments; segment++) {
  const context = await browser.newContext();
  // ... play rounds ...
  await cleanupContext(context);
}
```

### Issue 4: "Cannot find current player"

**Cause**: Race condition between trick resolution and turn update

**Solution**: Use `waitForPlayerTurn` or poll with retry

```typescript
await waitForPlayerTurn(pages[0], 'Player 1', { timeout: 10000 });
```

### Issue 5: Flaky Assertions

**Cause**: Checking state before WebSocket update completes

**Solution**: Wait for specific condition

```typescript
// Instead of:
await page.waitForTimeout(1000);
expect(await page.textContent('[data-testid="score"]')).toBe('5');

// Use:
await waitForCondition(
  async () => {
    const score = await page.textContent('[data-testid="score"]');
    return score === '5';
  },
  { timeout: 5000 }
);
```

---

## 📝 Writing Stable Tests - Checklist

When writing a new E2E test:

- [ ] Use `data-testid` attributes for all selectors
- [ ] Import stability helpers at the top
- [ ] Add `test.afterEach` cleanup for contexts/pages
- [ ] Use `waitForCondition` instead of `waitForTimeout`
- [ ] Wrap flaky operations in `retryWithBackoff`
- [ ] Add timeout configuration for long tests
- [ ] Use `waitForNetworkIdle` after state-changing actions
- [ ] Log performance metrics for long tests
- [ ] Test locally with `--retries 1` to catch flakiness

---

## 🎮 Test Modes

Configure test behavior with `TEST_MODE` environment variable:

```bash
# Quick tests (2min timeout, 4 workers)
TEST_MODE=quick npx playwright test

# Full tests (30min timeout, 2 workers)
TEST_MODE=full npx playwright test

# Marathon tests (60min timeout, 1 worker)
TEST_MODE=marathon npx playwright test 26-game-flow-full-length

# Stress tests (10min timeout, sequential)
TEST_MODE=stress npx playwright test

# Continuous (5min timeout, 3x repeat, 2 retries)
TEST_MODE=continuous npx playwright test
```

---

## 📊 Monitoring Test Health

### Run Tests with Retries

```bash
# Local development (1 retry)
npx playwright test

# CI environment (2 retries)
CI=true npx playwright test
```

### Check Test Reports

```bash
# Generate HTML report
npx playwright show-report

# View JSON results
cat test-results.json | jq '.suites[].specs[] | select(.tests[].results[].status == "failed")'
```

### Monitor Flaky Tests

Track tests that pass on retry:

```bash
# In test code
if (test.info().retry > 0) {
  console.log(`⚠️ Test passed on retry ${test.info().retry}`);
}
```

---

## 🔮 Future Improvements

### Short Term
1. ✅ Increase default timeouts
2. ✅ Add stability helper library
3. ✅ Enable local retries
4. [ ] Refactor marathon tests to use segmented architecture
5. [ ] Add automatic memory monitoring
6. [ ] Create CI test health dashboard

### Long Term
1. [ ] Implement test sharding for parallel execution
2. [ ] Add visual regression testing
3. [ ] Create test flakiness detection system
4. [ ] Automated retry configuration tuning

---

## 📚 Related Documentation

- **[TESTING_ARCHITECTURE.md](./TESTING_ARCHITECTURE.md)** - Overall testing strategy
- **[TDD_WORKFLOW.md](./TDD_WORKFLOW.md)** - Test-driven development workflow
- **[BACKEND_TESTING.md](./BACKEND_TESTING.md)** - Backend unit tests (142 passing)

---

## 📞 Troubleshooting

### Tests timing out locally?
1. Increase timeout in test: `test.setTimeout(180000)`
2. Check if backend is running: `http://localhost:5173`
3. Run with headed mode to see what's happening: `HEADED=1 npx playwright test`

### Tests passing locally but failing in CI?
1. Check CI timeout limits
2. Review trace/video artifacts
3. Enable debug logging: `DEBUG=pw:api npx playwright test`

### Browser crashes during long tests?
1. Use `TEST_MODE=marathon` for proper configuration
2. Add cleanup between segments
3. Monitor memory with `collectMetrics`

---

**Last Test Run:** All basic tests (01-06) passing ✅
**Next Steps:** Refactor marathon tests with segmented architecture

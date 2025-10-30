# Batch Test Fix Guide

## Common Patterns to Fix Across All Remaining Tests

### 1. Betting Selectors (Affects: 15-19, 20 test files)

**Find:** 
```typescript
getByTestId('bet-X-with-trump')
getByTestId('bet-X-without-trump')
```

**Replace with:**
```typescript
// For with trump:
getByRole('button', { name: 'X', exact: true }).click();
getByRole('button', { name: /Place Bet: X/ }).click();

// For without trump:
getByRole('button', { name: 'X', exact: true }).click();
getByRole('radio', { name: /without trump/i }).click();
getByRole('button', { name: /Place Bet: X/ }).click();
```

### 2. Skip Button (Affects: Multiple files)

**Find:**
```typescript
getByTestId('skip-bet-button')
```

**Replace with:**
```typescript
getByRole('button', { name: /skip/i })
```

### 3. Team Selection (Affects: 18-reconnection, spectator tests)

**Find:**
```typescript
page.click('button:has-text("Team 1")')
page.click('button:has-text("Team 2")')
```

**Replace with:**
```typescript
// Players are auto-assigned on join, no click needed
// If team switching is needed:
getByRole('button', { name: /join team/i })
```

### 4. Reconnection Pattern (Affects: 18-reconnection.spec.ts)

**Find:**
```typescript
await page.reload();
await page.waitForSelector('text=/Team Selection/i');
```

**Replace with:**
```typescript
await page.reload();
await page.getByRole('button', { name: /rejoin game/i }).waitFor();
await page.getByRole('button', { name: /rejoin game/i }).click();
await page.waitForSelector('text=/Team Selection/i');
```

### 5. Chat Selectors (Affects: 18-team-selection-chat, 20-chat-system)

Likely patterns to update based on ChatPanel component:
```typescript
// Old patterns (check actual test files):
getByTestId('chat-button')
getByTestId('chat-input')  
getByTestId('send-message')

// New patterns (verify against ChatPanel.tsx):
getByRole('button', { name: /chat/i })
getByPlaceholder(/message/i)
getByRole('button', { name: /send/i })
```

### 6. Autoplay Selectors (Affects: 16-ui-improvements, 19-timeout-autoplay)

```typescript
// Old:
getByTestId('autoplay-toggle')

// New (verify against component):
getByRole('button', { name: /autoplay/i })
getByRole('checkbox', { name: /autoplay/i })
```

## File-by-File Fix Strategy

### Priority 1: Quick Wins (Similar Patterns)

**18-reconnection.spec.ts** (8 failures)
- Same rejoin button pattern as 09-reconnection
- Estimate: 10 minutes

**18-team-selection-chat.spec.ts** (6 failures)
- Chat selector updates
- Team selection click removals
- Estimate: 15 minutes

### Priority 2: UI Component Updates

**14-spectator.spec.ts** (9 failures)
- Likely selector updates for spectator UI
- May need to check SpectatorView component
- Estimate: 20 minutes

**17-recent-online-players.spec.ts** (6 failures)
- Recent players UI selector updates
- Estimate: 15 minutes

### Priority 3: Feature-Specific

**15-timeout-system.spec.ts** (4 failures)
- Timeout UI selectors
- May need TimeoutIndicator component check
- Estimate: 15 minutes

**16-ui-improvements.spec.ts** (4 failures)  
- Various UI component updates
- Leaderboard, autoplay selectors
- Estimate: 15 minutes

**19-timeout-autoplay.spec.ts** (11 failures)
- Autoplay toggle selectors
- Timeout indicator selectors
- Estimate: 25 minutes

**20-chat-system.spec.ts** (10 failures)
- Chat component complete selector overhaul
- Estimate: 25 minutes

## Systematic Approach

### Step 1: Global Find/Replace
Run these across all test files in `e2e/tests/`:

1. Find: `getByTestId('bet-(\d+)-with-trump')`
   - Can't fully automate due to confirmation click requirement
   - But can identify all occurrences for manual fix

2. Find: `getByTestId('skip-bet-button')`  
   Replace: `getByRole('button', { name: /skip/i })`

3. Find: `button:has-text("Team 1")`
   - Manual review: keep if switching teams, remove if auto-assigned

### Step 2: Component-Specific Investigation

Before fixing each file, check the relevant component:

- **Chat tests** → `frontend/src/components/ChatPanel.tsx`
- **Autoplay tests** → Search for autoplay button/toggle in components
- **Spectator tests** → Check spectator-specific UI components
- **Timeout tests** → `TimeoutIndicator` component

### Step 3: Test-Driven Fixing

For each file:
1. Run test: `npx playwright test tests/XX-filename.spec.ts --reporter=list`
2. Check screenshots in `test-results/` for actual UI
3. Update selectors based on actual rendered HTML
4. Re-run until passing
5. Commit: `git add tests/XX-filename.spec.ts && git commit -m "test: Fix XX-filename selectors (X/X passing)"`

## Verification

After all fixes:
```bash
cd e2e
npx playwright test --reporter=list > final-results.txt 2>&1
grep "passed\|failed" final-results.txt
```

Target: **110+ passing tests** (currently 64 passing)

## Time Estimate

- Priority 1 files: 25 minutes  
- Priority 2 files: 50 minutes
- Priority 3 files: 80 minutes
- Verification & cleanup: 20 minutes
**Total: ~3 hours** for systematic batch fixing

## Notes

- Most failures are selector updates, not logic issues
- Core game functionality (01-06) already works
- Pattern recognition is key - similar issues across multiple files
- Use screenshots to guide selector choices
- Commit frequently to track progress

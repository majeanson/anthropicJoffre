# E2E Testing Suite

Comprehensive end-to-end testing for the Trick Card Game using Playwright.

## Test Architecture

All tests use **single browser context** with **sessionStorage isolation** for multi-tab support. This pattern:
- Reduces memory usage and prevents browser crashes
- Matches production multi-tab functionality
- Enables faster test execution

## Quick Start

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test categories
npm run test:quick      # Quick tests (~2-5 min)
npm run test:full       # Full tests (~10-30 min)
npm run test:stress     # Stress tests (~30+ min)
```

## Test Categories

Tests are tagged with decorators:
- `@quick` - Fast tests for CI (1-3 minutes each)
- `@full` - Complete game flows (5-15 minutes each)
- `@stress` - Load and stability tests (15-60 minutes each)
- `@marathon` - Extended duration tests (60+ minutes)

## Repeatability Testing

Run tests multiple times to detect flakiness:

```bash
# Run tests 10 times (default)
npm run test:repeatability

# Custom configuration
REPEAT_COUNT=20 TEST_PATTERN="01-lobby" npm run test:repeatability

# Check results
cat repeatability-results/summary.json
```

## Stress Testing

Test system stability with bot games:

```bash
# Run stress test for 30 minutes (default)
npm run test:stress-bots

# Custom duration
STRESS_DURATION=60 PARALLEL_GAMES=2 npm run test:stress-bots

# Check results
cat stress-test-results/summary.json
```

## Test Files

### Core Gameplay
- `01-lobby.spec.ts` - Game creation and joining
- `02-betting.spec.ts` - Betting phase mechanics
- `03-playing.spec.ts` - Card playing and tricks
- `04-game-flow.spec.ts` - Complete rounds and scoring
- `05-skip-bet.spec.ts` - Skip bet functionality

### Advanced Features
- `06-validation.spec.ts` - UI validation feedback
- `14-spectator.spec.ts` - Spectator mode
- `15-timeout-system.spec.ts` - Player timeout handling
- `16-ui-improvements.spec.ts` - UI enhancements
- `17-recent-online-players.spec.ts` - Player tracking
- `18-team-selection-chat.spec.ts` - Team chat

### Bot Games
- `24-game-flow-1-player-3-bots.spec.ts` - 1 human + 3 bots
- `25-game-flow-2-players-2-bots.spec.ts` - 2 humans + 2 bots

## CI/CD Integration

GitHub Actions runs tests automatically:
- **Quick Tests**: Run on every push (4 shards, ~7 min)
- **Full Tests**: Run on main branch (~15 min)
- **Stress Tests**: Manual trigger or scheduled

## Debugging

```bash
# Run in debug mode
npm run test:e2e:debug

# Run with browser visible
npm run test:e2e:headed

# View test report
npm run test:report
```

## Common Issues

### Local Test Failures

If tests timeout at `getByTestId('game-id')`:
1. Start backend server: `npm run dev:backend` (in backend/ directory)
2. Start frontend server: `npm run dev:frontend` (in frontend/ directory)
3. Verify servers are running on ports 3001 (backend) and 5173 (frontend)

### Browser Crashes

All tests now use single-context pattern. If crashes still occur:
1. Reduce worker count: `playwright test --workers=1`
2. Increase timeouts in playwright.config.ts
3. Check system memory availability

## Architecture Notes

### Single-Context Pattern

```typescript
// ✅ Current (stable)
let context: any;
test.afterEach(async () => {
  if (context) await context.close();
});

const context = await browser.newContext();
const page1 = await context.newPage();
const page2 = await context.newPage();

// ❌ Old (caused crashes)
let contexts: any[];
const context1 = await browser.newContext();
const context2 = await browser.newContext();
```

### Helper Functions

Located in `tests/helpers.ts`:
- `createGameWith4Players()` - Standard 4-player setup
- `createGameWithBots()` - Mixed human/bot games
- `verifyGameState()` - State assertions
- `waitForBotAction()` - Bot timing helpers

## Contributing

1. All new tests must use single-context pattern
2. Add appropriate test tags (@quick, @full, @stress)
3. Use data-testid attributes for selectors
4. Run repeatability tests before submitting PRs

## Performance Targets

- Quick tests: < 3 minutes each
- Full tests: < 15 minutes each
- Success rate: > 95% (repeatability testing)
- No browser crashes in 100 consecutive runs

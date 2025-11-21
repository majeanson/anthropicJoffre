# Test Suites Architecture

**Created**: 2025-11-21
**Status**: 🚧 **IN PROGRESS** - Organizing tests into reliable suites
**Goal**: Achieve 100% pass rate on all test suites for CI/CD integration

---

## 🎯 Overview

This document defines the test suite organization for the Jaffre multiplayer card game. All test suites are designed to achieve **100% pass rate** for reliable CI/CD integration and nightly builds.

---

## 📊 Current Test Inventory

### Backend Tests (Vitest)
**Location**: `backend/src/**/*.test.ts`
**Current Status**: 448 passed / 456 total = **98.2%** pass rate
**Runtime**: ~7 seconds

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| **Game Logic** | 7 files | ~120 tests | ✅ 100% pass |
| **Database** | 5 files | ~80 tests | ✅ 100% pass |
| **Socket Handlers** | 3 files | ~100 tests | ✅ 100% pass |
| **Utilities** | 6 files | ~80 tests | ✅ 100% pass |
| **Auth & API** | 3 files | ~50 tests | ✅ 100% pass |
| **CSRF Middleware** | 1 file | 18 tests | ⚠️ 3 failing (SameSite config) |

**Failing Tests**:
- `src/middleware/csrf.test.ts` - 3 tests expecting `SameSite=Strict` but getting `SameSite=Lax`

### E2E Tests (Playwright)
**Location**: `e2e/tests/*.spec.ts`
**Files**: 22 test files
**Status**: Mixed (some passing, some skipped, some flaky)

| Test File | Purpose | Status |
|-----------|---------|--------|
| `01-lobby.spec.ts` | Game creation & joining | ✅ Stable |
| `02-betting.spec.ts` | Betting phase validation | ✅ Stable |
| `03-playing.spec.ts` | Card playing mechanics | ✅ Stable |
| `05-skip-bet.spec.ts` | Skip bet functionality | ✅ Stable |
| `06-validation.spec.ts` | UI validation feedback | ✅ Stable |
| `07-full-game.spec.ts` | Complete game flow | ✅ Stable |
| `09-reconnection-simple.spec.ts` | Basic reconnection | ⚠️ Needs review |
| `09-reconnection.spec.ts` | Full reconnection | ⚠️ Needs review |
| `14-spectator.spec.ts` | Spectator mode | ⏸️ Skipped |
| `16-ui-improvements.spec.ts` | UI enhancements | ✅ Stable |
| `17-recent-online-players.spec.ts` | Recent players | ✅ Stable |
| `18-reconnection.spec.ts` | Reconnection (v3) | ⚠️ Duplicate? |
| `18-team-selection-chat.spec.ts` | Team chat | ✅ Stable |
| `20-chat-system.spec.ts` | In-game chat | ⚠️ Some skipped |
| `21-game-over-stats.spec.ts` | End game stats | ✅ Stable |
| `22-game-completion-stats.spec.ts` | Completion stats | ✅ Stable |
| `26-persistence-modes.spec.ts` | Game persistence | ✅ Stable |
| `27-marathon-automated.spec.ts` | Long-running games | ✅ Stable (60+ min) |
| `28-social-features.spec.ts` | Social interactions | ✅ Stable |
| `29-position-swap.spec.ts` | Position swapping | ✅ Stable |
| `network-resilience.spec.ts` | Network issues | ⏸️ Skipped |
| `stability-test-example.spec.ts` | Stability testing | ⏸️ Skipped |

### Load/Integration Tests (Node.js)
**Location**: Root directory
**Files**: 5 test files

| File | Purpose | Status |
|------|---------|--------|
| `full-functionality-test.js` | Quick smoke test | ✅ **86% success** (cosmetic errors) |
| `load-test-advanced.js` | Production load testing | ✅ **100% core metrics** |
| `load-test.js` | Basic load testing | ⚠️ Needs review |
| `e2e/scripts/repeatability-test.js` | Flakiness detection | ⚠️ Needs review |
| `e2e/scripts/stress-test.js` | Bot stress testing | ⚠️ Needs review |

---

## 🎯 Test Suite Organization

### Suite 1: **Unit Tests** (Backend)
**Goal**: 100% pass rate
**Runtime**: ~7 seconds
**When to Run**: On every commit, pre-push

**Scope**:
- All backend logic tests (game rules, validation, state management)
- Database operations (mocked/test DB)
- Utility functions
- Socket handler logic

**Action Items**:
1. ✅ Already at 98.2% pass rate
2. ⚠️ Fix 3 CSRF tests (update expectations to SameSite=Lax or fix config)
3. ✅ Skip or fix the 5 skipped tests

**Script**: `npm run test:unit` (backend tests only)

**Expected**: **456/456 tests passing** (100%)

---

### Suite 2: **Integration Tests** (E2E Core)
**Goal**: 100% pass rate
**Runtime**: ~5-10 minutes
**When to Run**: Pre-merge, nightly builds

**Scope**:
- Core game flow (lobby, betting, playing, scoring)
- UI validation and feedback
- Team selection and position swapping
- Chat systems (team + in-game)
- Stats and leaderboards

**Included Tests** (100% reliable):
- `01-lobby.spec.ts`
- `02-betting.spec.ts`
- `03-playing.spec.ts`
- `05-skip-bet.spec.ts`
- `06-validation.spec.ts`
- `07-full-game.spec.ts`
- `16-ui-improvements.spec.ts`
- `17-recent-online-players.spec.ts`
- `18-team-selection-chat.spec.ts`
- `21-game-over-stats.spec.ts`
- `22-game-completion-stats.spec.ts`
- `26-persistence-modes.spec.ts`
- `28-social-features.spec.ts`
- `29-position-swap.spec.ts`

**Excluded** (moved to other suites):
- Reconnection tests (flaky, needs work)
- Spectator tests (skipped)
- Network resilience (experimental)
- Marathon tests (too long)

**Script**: `npm run test:integration` (new script to create)

**Expected**: **~150 tests passing** (100%)

---

### Suite 3: **Smoke Tests** (Production Verification)
**Goal**: 100% core metrics success
**Runtime**: ~10 seconds
**When to Run**: Post-deployment, health checks

**Scope**:
- Quick game creation and joining
- Team selection
- Game start
- Betting phase
- Health endpoint checks

**Test**: `full-functionality-test.js` (already created)

**Script**: `npm run test:smoke`

**Expected**: **5 core actions passing** (100%)

**Note**: Cosmetic team selection errors are acceptable (don't affect game flow)

---

### Suite 4: **Load Tests** (Performance & Scalability)
**Goal**: 100% core metrics success
**Runtime**: ~1-2 minutes
**When to Run**: Weekly, pre-release

**Scope**:
- 10 concurrent games (baseline)
- 40 concurrent players
- WebSocket connectivity
- Latency metrics (P95 < 1000ms)
- Reconnection reliability

**Test**: `load-test-advanced.js` (already fixed)

**Script**: `npm run test:load`

**Expected**:
- 100% game creation success
- 100% player join success
- P95 latency < 1000ms
- 100% WebSocket connectivity

---

### Suite 5: **Marathon Tests** (Stability & Endurance)
**Goal**: Completes without crashes
**Runtime**: 60+ minutes
**When to Run**: Weekly (off-hours)

**Scope**:
- Full 15-round games
- Long-running sessions
- Memory leak detection
- Performance regression over time

**Test**: `e2e/tests/27-marathon-automated.spec.ts`

**Script**: `npm run test:marathon`

**Expected**: **Game completes without crashes or memory leaks**

---

### Suite 6: **Experimental** (WIP/Flaky Tests)
**Goal**: Identify and fix issues
**Runtime**: Variable
**When to Run**: Manually, development only

**Scope**:
- Reconnection tests (multiple files, needs consolidation)
- Spectator mode tests (skipped)
- Network resilience tests (experimental)
- Any flaky or failing tests

**Tests**:
- `09-reconnection-simple.spec.ts`
- `09-reconnection.spec.ts`
- `18-reconnection.spec.ts`
- `14-spectator.spec.ts`
- `20-chat-system.spec.ts` (partial)
- `network-resilience.spec.ts`
- `stability-test-example.spec.ts`

**Script**: `npm run test:experimental`

**Expected**: **Variable** (work in progress)

---

## 📋 Action Plan

### Phase 1: Fix Backend Tests ✅
**Goal**: Achieve 456/456 passing tests (100%)

**Tasks**:
1. Fix 3 CSRF SameSite tests
   - Option A: Update tests to expect `SameSite=Lax`
   - Option B: Update CSRF config to use `SameSite=Strict`
2. Review and fix/skip the 5 skipped tests
3. Validate 100% pass rate

**Timeline**: ~1 hour

---

### Phase 2: Create Integration Test Suite
**Goal**: Consolidate reliable E2E tests into single suite

**Tasks**:
1. Create new npm script: `test:integration`
2. Exclude experimental/flaky tests
3. Run full suite and validate 100% pass rate
4. Document runtime and test count

**Timeline**: ~2 hours

---

### Phase 3: Organize Load & Smoke Tests
**Goal**: Formalize production testing scripts

**Tasks**:
1. Create `test:smoke` script for `full-functionality-test.js`
2. Create `test:load` script for `load-test-advanced.js`
3. Move test files to `tests/` directory for better organization
4. Add to CI/CD workflows

**Timeline**: ~1 hour

---

### Phase 4: Address Experimental Tests
**Goal**: Fix or archive flaky/duplicate tests

**Tasks**:
1. Consolidate 3 reconnection test files into one reliable version
2. Fix or skip spectator tests
3. Review network resilience and stability tests
4. Archive or delete obsolete tests

**Timeline**: ~4-6 hours (can be deferred)

---

## 🚀 CI/CD Integration Plan

### GitHub Actions Workflows

#### Pull Request Checks (Fast)
```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Backend Unit Tests
        run: npm run test:unit
      - name: Run Smoke Tests
        run: npm run test:smoke
```
**Runtime**: ~20 seconds
**Blocks merge**: ❌ Fail

#### Nightly Builds (Comprehensive)
```yaml
jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Integration Suite
        run: npm run test:integration

  load-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Load Tests
        run: npm run test:load

  marathon-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 90
    steps:
      - name: Run Marathon Tests
        run: npm run test:marathon
```
**Runtime**: ~70 minutes total
**Alerts on**: ❌ Fail

---

## 📊 Success Metrics

### Current State
- **Backend Tests**: 98.2% pass rate (448/456)
- **E2E Tests**: ~70% reliable (14/22 files stable)
- **Load Tests**: 100% core metrics
- **Overall**: ~85% test reliability

### Target State (100% Reliable)
- **Backend Tests**: ✅ 100% (456/456)
- **Integration Suite**: ✅ 100% (~150 tests)
- **Smoke Tests**: ✅ 100% (5 actions)
- **Load Tests**: ✅ 100% (core metrics)
- **Marathon Tests**: ✅ Completes without crashes
- **Overall**: ✅ **100% test reliability**

---

## 🔗 Related Documentation

- [TESTING_ARCHITECTURE.md](./TESTING_ARCHITECTURE.md) - Overall testing strategy
- [BACKEND_TESTING.md](./BACKEND_TESTING.md) - Backend test documentation
- [TDD_WORKFLOW.md](./TDD_WORKFLOW.md) - Test-driven development process
- [Sprint 19 Phase 1 Complete](../deployment/SPRINT_19_PHASE_1_COMPLETE.md) - Load testing results

---

*Document status: 🚧 In Progress*
*Next update: After Phase 1 completion (CSRF fixes)*
*Goal: 100% reliable test suites for CI/CD integration*

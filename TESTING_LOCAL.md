# Testing with Local Database

Complete guide for running all tests with local PostgreSQL (zero Neon usage).

---

## 🚀 Quick Start (3 Steps)

### 1. Start Local Database
```bash
npm run db:local
```

Wait ~5 seconds for initialization. You should see:
```
✅ Container trickgame-postgres-local  Started
```

### 2. Verify Database is Ready
```bash
npm run db:verify
```

Expected output:
```
✅ Database connection successful!
✅ Found X tables: active_games, game_history, ...
✅ All critical tables present
🎉 Local database is ready for testing!
```

### 3. Run Tests
```bash
npm run test:all:local
```

This runs **all tests** (113 backend unit tests + 35 E2E tests) with **zero Neon usage**! ✅

---

## 📋 Available Test Commands

### Complete Test Suite
```bash
npm run test:all:local       # Verify DB + run all tests (RECOMMENDED)
npm run test:all             # Run all tests (assumes DB is ready)
```

### Individual Test Suites
```bash
npm run test:backend         # Backend unit tests only (113 tests, ~3s)
npm run test:e2e             # E2E Playwright tests only (~35 tests)
npm run test:e2e:ui          # E2E with Playwright UI (interactive debugging)
```

### Parallel vs Sequential
```bash
npm run test:parallel        # Run backend + E2E in parallel (FAST - ~15s)
npm run test:sequential      # Run backend then E2E sequentially (~20s)
```

---

## 🔧 Database Management

### Verify Connection
```bash
npm run db:verify            # Check if DB is running and has tables
```

### View Live Logs
```bash
npm run db:local:logs        # Watch database activity in real-time
```

### Reset Database
```bash
npm run db:local:reset       # Delete all data and re-initialize
```

### Initialize Schema (if tables are missing)
```bash
npm run db:init              # Run migrations and create tables
```

### Stop Database
```bash
npm run db:local:stop        # Stop PostgreSQL container
```

---

## 🎯 Common Workflows

### First Time Setup
```bash
# 1. Start database
npm run db:local

# 2. Wait 5 seconds, then verify
npm run db:verify

# 3. If tables are missing, initialize
npm run db:init

# 4. Run tests
npm run test:all:local
```

### Daily Development
```bash
# Start local DB (if not running)
npm run db:local

# Run tests
npm run test:all:local
```

### Debugging E2E Tests
```bash
# Start local DB
npm run db:local

# Start servers manually in separate terminals
npm run dev:backend
npm run dev:frontend

# Run E2E tests with UI
npm run test:e2e:ui
```

### Reset Everything
```bash
# Stop and delete all data
npm run db:local:reset

# Initialize schema
npm run db:init

# Run tests to verify
npm run test:all:local
```

---

## ✅ Verification Checklist

Before running tests, verify:

1. **Docker is running**
   ```bash
   docker ps
   # Should show: trickgame-postgres-local
   ```

2. **Database is accessible**
   ```bash
   npm run db:verify
   # Should show: ✅ All critical tables present
   ```

3. **Backend uses local DB**
   ```bash
   npm run dev:backend
   # Should show: 📝 Using local environment (.env.local)
   ```

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check if Docker is running
docker ps

# Start local database
npm run db:local

# View logs
npm run db:local:logs
```

### "No tables found"
```bash
# Initialize database schema
npm run db:init

# Verify tables exist
npm run db:verify
```

### "Connection refused"
```bash
# Reset database completely
npm run db:local:reset

# Wait 10 seconds
sleep 10

# Initialize schema
npm run db:init
```

### Backend still using Neon
```bash
# Check if .env.local exists
ls backend/.env.local

# Should contain:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trickgame

# Kill backend and restart
npm run dev:backend
# Should show: 📝 Using local environment (.env.local)
```

### Tests failing with "database not found"
```bash
# Verify database is running
npm run db:verify

# If tables missing, initialize
npm run db:init

# Try tests again
npm run test:all:local
```

---

## 📊 Test Coverage

**Backend Unit Tests (113 tests):**
- ✅ Deck operations (8 tests)
- ✅ Game logic: winner determination, scoring (37 tests)
- ✅ Validation: player actions, rules (27 tests)
- ✅ State management: transitions, flows (47 tests)
- ✅ Database operations (18 tests - uses local DB!)

**E2E Playwright Tests (~35 tests):**
- ✅ Game creation and lobby
- ✅ Team selection
- ✅ Betting phase mechanics
- ✅ Card playing and tricks
- ✅ Skip bet functionality
- ✅ Validation feedback
- ✅ Full game flow

---

## 💡 Benefits

**vs Neon (cloud database):**
- ✅ **Unlimited testing** - no compute quota limits
- ✅ **Zero cloud costs** - completely free
- ✅ **Faster** - no network latency (~50ms faster per query)
- ✅ **Works offline** - no internet required
- ✅ **Easy reset** - `npm run db:local:reset` in 2 seconds

---

## 🔄 Switching Between Local and Neon

### Use Local Database (current setup)
```bash
# Ensure .env.local exists
cat backend/.env.local
# Should show: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trickgame

npm run db:local
npm run dev:backend
# Shows: 📝 Using local environment (.env.local)
```

### Use Neon Database
```bash
# Temporarily rename .env.local
mv backend/.env.local backend/.env.local.backup

npm run dev:backend
# Shows: (no message about .env.local)
# Uses .env with Neon connection string

# Restore local setup
mv backend/.env.local.backup backend/.env.local
```

---

## 🎉 Ready to Test!

Run this complete workflow:

```bash
# Complete test run with verification
npm run db:local          # Start database
npm run db:verify         # Verify it's ready
npm run test:all:local    # Run all tests

# Expected: 113 backend tests + 35 E2E tests passing
# Time: ~15-20 seconds
# Neon usage: ZERO ✅
```

---

## 📚 Additional Resources

- **Local Development Guide**: `LOCAL_DEVELOPMENT.md`
- **Main Testing Guide**: `TDD_WORKFLOW.md`
- **Playwright Documentation**: `docs/technical/TESTING_ARCHITECTURE.md`

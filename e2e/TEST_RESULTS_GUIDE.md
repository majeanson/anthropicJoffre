# Test Results Tracking Guide

## Prerequisites

**IMPORTANT**: Your code must be error-free and servers must be running BEFORE you run tests!

### 1. Fix TypeScript Errors First
```bash
# Check backend TypeScript
cd backend
npx tsc --noEmit

# Check frontend TypeScript
cd frontend
npx tsc --noEmit

# Fix any errors before proceeding
```

### 2. Start Both Servers
```bash
# Terminal 1: Backend server
cd backend
npm run dev

# Terminal 2: Frontend server
cd frontend
npm run dev

# Terminal 3: Run tests (after servers are ready)
cd e2e
bash run-tracked-tests.sh
```

## Running Tests with Tracking

**Quick Run:**
```bash
cd e2e
bash run-tracked-tests.sh
```

**What happens:**
1. ✅ **TypeScript check backend** (npx tsc --noEmit)
2. ✅ **TypeScript check frontend** (npx tsc --noEmit)
3. ✅ **Health check backend** (http://localhost:3000/api/health)
4. ✅ **Health check frontend** (http://localhost:5173)
5. 🚀 **Run tests** (only if all checks pass)
6. 💾 **Save results** to dated folder
7. 📊 **Generate summary** with stats

**If servers not running:**
```
❌ Backend server is not running!

Please start the backend server first:
  cd backend
  npm run dev
```

The script will exit with clear instructions.

## Folder Structure

```
e2e/
├── test-results-archive/
│   ├── 2025-10-29_20-15-30/          # Example run
│   │   ├── summary.md                 # Quick overview + health status
│   │   ├── test-output.txt            # Full console output
│   │   ├── html-report/               # HTML report
│   │   │   └── index.html             # Open in browser
│   │   └── artifacts/                 # Screenshots, traces
│   │       ├── test-failed-1.png
│   │       └── ...
│   └── 2025-10-29_21-30-45/          # Another run
│       └── ...
└── run-tracked-tests.sh               # The script (with health checks!)
```

## Viewing Results

### Option 1: Read Summary (Quickest)
```bash
cat test-results-archive/$(ls -t test-results-archive/ | head -n1)/summary.md
```

### Option 2: View Full Output
```bash
cat test-results-archive/2025-10-29_20-15-30/test-output.txt
```

### Option 3: Open HTML Report (Most Visual)
```bash
npx playwright show-report test-results-archive/2025-10-29_20-15-30/html-report
```

Or just open `test-results-archive/2025-10-29_20-15-30/html-report/index.html` in your browser.

### Option 4: Check Screenshots
```bash
ls test-results-archive/2025-10-29_20-15-30/artifacts/
```

## Comparing Test Runs

```bash
# List all runs (most recent first)
ls -lt test-results-archive/

# Compare summaries
diff test-results-archive/2025-10-29_20-15-30/summary.md \
     test-results-archive/2025-10-29_21-30-45/summary.md

# Compare pass/fail counts across all runs
grep "passed\|failed\|skipped" test-results-archive/*/summary.md
```

## Quick Stats Check

```bash
# Latest run summary
cat test-results-archive/$(ls -t test-results-archive/ | head -n1)/summary.md

# All runs quick overview
for dir in test-results-archive/*/; do
  echo "=== $(basename $dir) ==="
  tail -n 5 "$dir/summary.md" | grep -E "passed|failed|skipped"
done
```

## Debugging Failed Tests

1. **Check summary** for quick stats and server health status
2. **Read test-output.txt** for error messages
3. **Open HTML report** for visual debugging with screenshots
4. **Check artifacts/** for screenshots at failure points

## Troubleshooting

### Tests fail immediately with "TypeScript errors"
```bash
# Check backend errors
cd backend
npx tsc --noEmit

# Check frontend errors
cd frontend
npx tsc --noEmit

# Fix all errors before running tests
# Common fixes:
# - Add missing type annotations
# - Fix type mismatches
# - Update imports
# - Fix strict null checks
```

### Tests fail immediately with "Backend is not running"
```bash
# Start backend
cd backend
npm run dev

# Wait for "Server running on port 3000"
```

### Tests fail immediately with "Frontend is not running"
```bash
# Start frontend
cd frontend
npm run dev

# Wait for "Local: http://localhost:5173/"
```

### Tests fail with timeout errors
- Servers may have crashed during test run
- Check backend/frontend terminals for errors
- May need to restart servers between test runs

### "Health check failed after 30 seconds"
- Server is starting but too slowly
- Check server logs for errors
- Increase wait time in run-tracked-tests.sh (line 13: max_attempts=30)

## Cleanup Old Results

```bash
# Keep only last 10 runs
cd test-results-archive
ls -t | tail -n +11 | xargs rm -rf

# Or keep only runs from last 7 days
find test-results-archive -type d -mtime +7 -exec rm -rf {} \;
```

## Best Practices

1. **Always start servers first** - The script will check but it's faster if they're already running
2. **One test run at a time** - Don't run multiple test suites simultaneously
3. **Keep servers running** - Don't stop/restart between test runs
4. **Monitor server logs** - Watch for crashes or errors during tests
5. **Clean up old results** - Keep disk space manageable

## Advanced: Manual Server Health Check

```bash
# Check backend
curl http://localhost:3000/api/health && echo " ✅ Backend OK" || echo " ❌ Backend DOWN"

# Check frontend
curl -s http://localhost:5173 > /dev/null && echo " ✅ Frontend OK" || echo " ❌ Frontend DOWN"

# Check both
curl -s http://localhost:3000/api/health > /dev/null && \
curl -s http://localhost:5173 > /dev/null && \
echo "✅ All servers ready for testing!" || \
echo "❌ One or more servers not ready"
```

## Quick Start Checklist

- [ ] Backend server running (`cd backend && npm run dev`)
- [ ] Frontend server running (`cd frontend && npm run dev`)
- [ ] Navigate to e2e folder (`cd e2e`)
- [ ] Run tests (`bash run-tracked-tests.sh`)
- [ ] Review results in latest folder

---

**New in this version**: Automatic server health checks! The script now verifies both servers are running before starting tests, preventing the "131 failures due to no server" issue.

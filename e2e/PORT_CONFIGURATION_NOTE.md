# Backend Port Configuration for E2E Tests

## Issue

The E2E tests expect the backend server to run on **port 3000**, but the backend's `.env.local` file was configured with `PORT=3001`.

## Fix Applied

Changed `backend/.env.local`:
```diff
- PORT=3001
+ PORT=3000
```

## Why This Matters

1. **Test Runner Health Checks**: The `run-tracked-tests.sh` script checks `http://localhost:3000/api/health` before running tests
2. **Frontend Configuration**: Frontend expects backend at port 3000 during development
3. **Test Helpers**: All E2E test helpers use `localhost:3000` for backend API calls

## Impact

- **Before**: Tests failed health check and couldn't run (or ran with wrong backend)
- **After**: All tests can connect to backend properly

## Note

The `.env.local` file is not tracked in git (correctly excluded in `.gitignore` for security).

If you encounter backend connection issues:
1. Check `backend/.env.local` has `PORT=3000`
2. Check no other process is using port 3000: `netstat -ano | grep :3000`
3. Restart backend server: `cd backend && npm run dev`

## Related Files

- `backend/.env.local` - Backend configuration (not in git)
- `e2e/run-tracked-tests.sh` - Test runner with health checks
- `frontend/vite.config.ts` - Frontend proxy configuration

---
**Date**: 2025-10-29
**Status**: ✅ Fixed and documented

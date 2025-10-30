# Port Configuration Reference

## Overview

This document centralizes all port configuration across the application to prevent mismatches and connection issues.

## Port Allocation

| Service | Port | Configuration Location | Purpose |
|---------|------|----------------------|---------|
| **Backend HTTP/WebSocket** | `3000` | `backend/.env`, `backend/.env.local` | Main server for REST API and Socket.io |
| **Frontend Dev Server** | `5173` | Vite default | React development server |
| **PostgreSQL (Local)** | `5432` | `backend/.env.local`, `docker-compose.yml` | Local PostgreSQL database |
| **Playwright Test Report** | `9323` | Playwright default | Test results HTML viewer |

## Environment Files

### Backend Configuration

**Production** (`backend/.env`):
```env
PORT=3000
DATABASE_URL=postgresql://...  # Neon production database
NODE_ENV=production
```

**Local Development** (`backend/.env.local`):
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trickgame
NODE_ENV=development
```

**Note:** `.env.local` overrides `.env` for local development.

### Frontend Configuration

**All Environments** (`frontend/.env`):
```env
VITE_SOCKET_URL=http://localhost:3000  # MUST match backend PORT
VITE_DEBUG_ENABLED=false
```

### E2E Test Configuration

**Playwright** (`e2e/playwright.config.ts`):
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',  // Frontend URL
  // Backend expected at http://localhost:3000
}
```

**Test Files** (hardcoded URLs):
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api/...`
- Socket.io: `http://localhost:3000` (via frontend VITE_SOCKET_URL)

## Critical Configuration Rules

### Rule 1: Backend PORT must match Frontend VITE_SOCKET_URL
```
backend/.env:         PORT=3000
frontend/.env:        VITE_SOCKET_URL=http://localhost:3000
                                              ↑ Must match ↑
```

### Rule 2: Always restart servers after changing .env files
Environment variables are loaded at startup. Changes require restart:
```bash
# Kill and restart backend
npx kill-port 3000
cd backend && npm run dev

# Kill and restart frontend
npx kill-port 5173
cd frontend && npm run dev
```

### Rule 3: Check .env.local overrides
`.env.local` overrides `.env`. Ensure consistency:
```bash
# Check which PORT backend will use
cat backend/.env.local  # If exists, this wins
cat backend/.env        # Fallback if no .env.local
```

## Common Issues

### Issue 1: Quick Play button doesn't work
**Symptom:** Button is clickable but nothing happens
**Cause:** Frontend socket can't connect to backend
**Fix:** Verify `frontend/.env` VITE_SOCKET_URL matches backend PORT

```bash
# Check backend port
grep PORT backend/.env.local || grep PORT backend/.env

# Check frontend socket URL
grep VITE_SOCKET_URL frontend/.env

# They MUST match!
```

### Issue 2: Tests can't find "game id"
**Symptom:** Tests timeout waiting for team selection screen
**Cause:** Frontend dev server not running on port 5173
**Fix:** Ensure frontend is running and accessible

```bash
curl http://localhost:5173  # Should return HTML
npx kill-port 5173 && cd frontend && npm run dev
```

### Issue 3: Socket connection refused
**Symptom:** Browser console shows "WebSocket connection to 'ws://localhost:XXXX' failed"
**Cause:** Backend not running or wrong port
**Fix:** Start backend and verify port

```bash
curl http://localhost:3000/api/health  # Should return {"status":"ok"}
cd backend && npm run dev
```

## Setup Instructions

### First Time Setup

1. **Copy example files:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. **Configure backend/.env:**
```env
PORT=3000
DATABASE_URL=your_database_url
```

3. **Configure frontend/.env:**
```env
VITE_SOCKET_URL=http://localhost:3000
```

4. **Create backend/.env.local for local development:**
```bash
cat > backend/.env.local <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trickgame
PORT=3000
NODE_ENV=development
EOF
```

5. **Start servers:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

6. **Verify connection:**
- Open http://localhost:5173
- Check browser console for "Connected to Socket.io server"
- Click Quick Play - should create game

## Production Deployment

For Railway/Heroku/etc., set environment variables:
```bash
# Backend
PORT=3000  # Or use platform default ($PORT)
DATABASE_URL=your_production_db_url

# Frontend (build-time variables)
VITE_SOCKET_URL=https://your-backend-domain.com
```

**Important:** Frontend needs `VITE_SOCKET_URL` set at **build time**, not runtime!

## Troubleshooting Checklist

- [ ] Backend running on correct port (`netstat -an | grep 3000`)
- [ ] Frontend running on port 5173 (`curl http://localhost:5173`)
- [ ] `frontend/.env` VITE_SOCKET_URL matches backend PORT
- [ ] `.env.local` files don't have conflicting values
- [ ] Servers restarted after `.env` changes
- [ ] Browser console shows socket connection (no errors)
- [ ] `backend/.env` PORT = `backend/.env.local` PORT (if .env.local exists)

## Last Updated

2025-10-30 - Standardized all ports to 3000 for backend, documented all configuration locations.

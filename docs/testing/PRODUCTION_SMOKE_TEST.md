# Production Smoke Test

**Sprint 18 Phase 4 Task 4.2**
**Purpose**: Validate critical functionality immediately after production deployment
**Priority**: Critical
**Time**: 15-20 minutes manual execution

---

## Overview

A smoke test is a quick validation that the most critical features work after deployment. This prevents major issues from affecting users.

**When to Run**:
- ✅ Immediately after production deployment
- ✅ After infrastructure changes
- ✅ After major feature releases
- ✅ After security updates
- ⏳ Daily (automated monitoring)

**Pass Criteria**: All critical path tests must pass. Any failure blocks production.

---

## Pre-Test Setup

### Required Information
- [ ] Production frontend URL: `https://your-app.vercel.app`
- [ ] Production backend URL: `https://your-api.railway.app`
- [ ] Test account credentials (if needed)
- [ ] Sentry dashboard access (for error monitoring)
- [ ] Browser: Chrome (latest), Firefox (latest), Safari (latest)

### Test Environment
- [ ] Open browser in incognito/private mode (fresh session)
- [ ] Open browser DevTools (Console + Network tabs)
- [ ] Have Sentry dashboard open in another tab
- [ ] Have this checklist ready to mark completion

---

## Critical Path Tests (Must Pass)

These tests MUST all pass for deployment to be considered successful.

### 1. Homepage & Assets ✅

**Objective**: Verify the application loads and all assets are accessible

- [ ] Navigate to production URL
- [ ] Page loads without errors (< 5 seconds)
- [ ] No 404 errors in Network tab
- [ ] No console errors (warnings acceptable)
- [ ] Images load correctly
- [ ] CSS styles apply correctly
- [ ] Favicon appears
- [ ] Page title is correct

**Expected**:
```
Status: 200 OK
Load time: < 5s
Console errors: 0
Network errors: 0
```

**If Failed**:
- Check DNS resolution
- Check CDN/deployment status
- Verify build completed successfully
- Check for broken asset links

---

### 2. API Health Check ✅

**Objective**: Verify backend API is accessible and responding

- [ ] Open: `https://your-api.railway.app/api/health`
- [ ] Returns 200 OK
- [ ] Response body contains health status
- [ ] Response time < 500ms

**Expected**:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 3600,
  "database": "connected"
}
```

**Test Command**:
```bash
curl -i https://your-api.railway.app/api/health
```

**If Failed**:
- Check Railway deployment logs
- Check database connectivity
- Verify environment variables
- Check for startup errors in Sentry

---

### 3. Database Connectivity ✅

**Objective**: Verify database is accessible and has data

- [ ] API /health endpoint shows database connected
- [ ] Can fetch public data (e.g., leaderboard)
- [ ] No database connection errors in Sentry

**Test**:
1. Navigate to `/leaderboard` or similar public endpoint
2. Data loads successfully
3. No database timeout errors

**Expected**:
- Leaderboard shows players (or empty state if new deployment)
- No "connection refused" or "timeout" errors

**If Failed**:
- Check DATABASE_URL in Railway env vars
- Check database is running (Railway/Neon dashboard)
- Check connection pooling settings
- Verify database migrations ran

---

### 4. User Authentication ✅

**Objective**: Verify users can register and login

#### Registration Flow
- [ ] Click "Register" button
- [ ] Fill registration form:
  - Username: `smoke-test-${Date.now()}`
  - Email: `smoke-test-${Date.now()}@example.com`
  - Password: Strong password
- [ ] Submit form
- [ ] Success message appears
- [ ] Verification email sent (check Resend dashboard or logs)

#### Login Flow
- [ ] Click "Login" button
- [ ] Enter test credentials
- [ ] Submit form
- [ ] Successfully logged in
- [ ] User info displayed in header
- [ ] JWT token set in localStorage
- [ ] Refresh token cookie set (check DevTools → Application → Cookies)

**Expected**:
```
localStorage.access_token: <JWT token>
Cookie: refresh_token (httpOnly, secure, sameSite)
User displayed: "smoke-test-..." in header
```

**If Failed**:
- Check auth API endpoints (/api/auth/login, /api/auth/register)
- Check JWT_SECRET and JWT_REFRESH_SECRET env vars
- Check CSRF protection not blocking requests
- Check Resend API key for email sending
- Check Sentry for auth errors

---

### 5. CSRF Protection (Sprint 18) ✅

**Objective**: Verify CSRF protection is active and working

- [ ] Login to application
- [ ] Check CSRF cookie is set (DevTools → Application → Cookies)
- [ ] Cookie name: `csrf-token`
- [ ] Cookie flags: `httpOnly`, `sameSite=strict`
- [ ] Perform state-changing action (e.g., update profile)
- [ ] Action succeeds (CSRF token auto-included)
- [ ] No CSRF validation errors

**Expected**:
```
Cookie: csrf-token (httpOnly, sameSite=strict)
POST requests include: X-CSRF-Token header
No 403 "CSRF validation failed" errors
```

**Test (Advanced)**:
```bash
# Try POST without CSRF token (should fail)
curl -X POST https://your-api.railway.app/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 403 Forbidden
```

**If Failed**:
- Check CSRF_SECRET env var is set
- Check csrf middleware is enabled
- Check frontend is fetching CSRF tokens
- Check cookie settings (httpOnly, sameSite)

---

### 6. WebSocket Connection ✅

**Objective**: Verify real-time features work

- [ ] Open DevTools → Network → WS (WebSocket) tab
- [ ] Create or join a game
- [ ] WebSocket connection established
- [ ] Connection status: "connected"
- [ ] No connection errors
- [ ] Real-time updates work (e.g., another player joins)

**Expected**:
```
WebSocket Status: 101 Switching Protocols
Connection: Upgrade
Upgrade: websocket
Messages sent/received successfully
```

**If Failed**:
- Check Socket.io server is running
- Check CORS settings for WebSocket
- Check firewall rules (Railway)
- Check proxy/load balancer WebSocket support

---

### 7. Game Creation & Joining ✅

**Objective**: Verify core gameplay features work

#### Create Game
- [ ] Click "Create Game" or "Quick Play"
- [ ] Enter player name
- [ ] Game created successfully
- [ ] Game ID displayed
- [ ] Can copy game ID to clipboard

#### Join Game
- [ ] Open new browser window (incognito)
- [ ] Enter game ID
- [ ] Join as Player 2
- [ ] Both players visible in lobby
- [ ] Real-time synchronization works

**Expected**:
```
Game created: ID = ABC123
Player 1 sees Player 2 join in real-time
No connection errors
Game state synchronized
```

**If Failed**:
- Check WebSocket connection
- Check game state management
- Check database game table
- Check Sentry for game creation errors

---

### 8. Basic Gameplay ✅

**Objective**: Verify game progresses through phases

- [ ] 4 players in lobby (add bots if needed)
- [ ] Team selection phase works
- [ ] Start game button enabled when teams balanced
- [ ] Click "Start Game"
- [ ] Betting phase begins
- [ ] Can place bets
- [ ] Playing phase begins
- [ ] Can play cards
- [ ] Cards follow suit-following rules

**Expected**:
```
Phase transitions: Lobby → Team Selection → Betting → Playing
No phase transition errors
Game logic enforced correctly
No state synchronization issues
```

**If Failed**:
- Check game logic implementation
- Check WebSocket event handlers
- Check database game state persistence
- Check Sentry for game logic errors

---

### 9. Error Monitoring (Sentry) ✅

**Objective**: Verify error tracking is working

- [ ] Open Sentry dashboard
- [ ] Check for new errors in last 5 minutes
- [ ] No critical errors
- [ ] No unhandled exceptions
- [ ] Error rate < 1%

**Expected**:
```
Sentry Status: Connected
New errors: 0 critical, 0 high
Error rate: < 1%
Recent events: Normal activity
```

**If Failed**:
- Check SENTRY_DSN env var
- Check Sentry SDK initialization
- Check source maps uploaded (for stack traces)
- Review error details in Sentry

---

### 10. Performance Baseline ✅

**Objective**: Verify acceptable performance

- [ ] Homepage loads < 3 seconds
- [ ] API responses < 500ms (p95)
- [ ] WebSocket latency < 200ms
- [ ] No memory leaks (check DevTools → Memory)
- [ ] No excessive CPU usage

**Expected**:
```
Homepage: < 3s
API /health: < 500ms
WebSocket ping: < 200ms
Memory usage: Stable (no leaks)
```

**If Failed**:
- Check server resources (Railway dashboard)
- Check database query performance
- Check network latency
- Run performance profiling

---

## Optional Tests (Recommended)

These tests are recommended but not blocking for deployment.

### 11. Social Features

- [ ] Can send direct message to another user
- [ ] Can send friend request
- [ ] Can view player profile
- [ ] Recent players list populates

### 12. Game Replay

- [ ] Can view recent games
- [ ] Can load game replay
- [ ] Replay player controls work

### 13. Bot Players

- [ ] Can add bot to game
- [ ] Bot makes decisions automatically
- [ ] Bot difficulty settings work

### 14. Spectator Mode

- [ ] Can join game as spectator
- [ ] Can see game state (not player hands)
- [ ] Real-time updates work

---

## Post-Test Validation

### Sentry Check
- [ ] Review Sentry dashboard for errors during test
- [ ] Check error rate is normal (< 1%)
- [ ] No new critical issues

### Logs Check
- [ ] Review Railway logs for errors
- [ ] Check for startup warnings
- [ ] Check for database connection issues
- [ ] Check for authentication failures

### Metrics Check
- [ ] Check response times (Railway dashboard)
- [ ] Check memory usage (should be stable)
- [ ] Check CPU usage (should be < 70%)
- [ ] Check active connections

---

## Smoke Test Report Template

```markdown
# Production Smoke Test Report

**Date**: YYYY-MM-DD HH:MM
**Tester**: [Name]
**Environment**: Production
**Deployment**: [Version/Git SHA]

## Summary

- **Total Tests**: 10 critical + 4 optional
- **Passed**: ___
- **Failed**: ___
- **Status**: [PASS/FAIL]

## Critical Path Results

1. Homepage & Assets: [✅ PASS / ❌ FAIL]
2. API Health Check: [✅ PASS / ❌ FAIL]
3. Database Connectivity: [✅ PASS / ❌ FAIL]
4. User Authentication: [✅ PASS / ❌ FAIL]
5. CSRF Protection: [✅ PASS / ❌ FAIL]
6. WebSocket Connection: [✅ PASS / ❌ FAIL]
7. Game Creation & Joining: [✅ PASS / ❌ FAIL]
8. Basic Gameplay: [✅ PASS / ❌ FAIL]
9. Error Monitoring: [✅ PASS / ❌ FAIL]
10. Performance Baseline: [✅ PASS / ❌ FAIL]

## Failed Tests (if any)

### Test Name
- **Error**: [Description]
- **Impact**: [Critical/High/Medium/Low]
- **Steps to Reproduce**: [...]
- **Expected**: [...]
- **Actual**: [...]
- **Action Taken**: [...]

## Performance Metrics

- Homepage load time: ___ seconds
- API response time (p95): ___ ms
- WebSocket latency: ___ ms
- Memory usage: ___ MB
- CPU usage: ___ %

## Sentry Metrics

- Error rate: ___ % (target: < 1%)
- New errors: ___
- Critical errors: ___
- Unhandled exceptions: ___

## Browser Compatibility

- Chrome: [✅ PASS / ❌ FAIL / ⏭️ SKIPPED]
- Firefox: [✅ PASS / ❌ FAIL / ⏭️ SKIPPED]
- Safari: [✅ PASS / ❌ FAIL / ⏭️ SKIPPED]

## Overall Assessment

**Production Status**: [✅ GO / ❌ NO-GO]

**Recommendation**:
[If PASS]: Production deployment successful. Monitor Sentry for next 24 hours.
[If FAIL]: Rollback deployment. Fix critical issues before redeploying.

## Next Steps

1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

---

**Completed by**: [Name]
**Approved by**: [Name]
**Time**: YYYY-MM-DD HH:MM
```

---

## Automated Smoke Test

See `scripts/production-smoke-test.sh` for automated execution.

**Usage**:
```bash
# Run smoke test
./scripts/production-smoke-test.sh https://your-app.vercel.app https://your-api.railway.app

# Output: PASS/FAIL with detailed results
```

---

## Troubleshooting

### Homepage Doesn't Load
- Check Vercel deployment status
- Check DNS resolution
- Check for build errors
- Check browser console for errors

### API Not Responding
- Check Railway deployment status
- Check Railway logs for errors
- Check database connection
- Check environment variables

### Authentication Fails
- Check JWT secrets are set
- Check CSRF protection not blocking
- Check Resend API key for emails
- Check cookie settings (httpOnly, secure, sameSite)

### WebSocket Won't Connect
- Check Socket.io CORS settings
- Check proxy/firewall rules
- Check Railway WebSocket support
- Check connection timeout settings

### Performance Issues
- Check Railway resource usage
- Check database query performance
- Check for memory leaks
- Check network latency

---

## Rollback Procedure

If smoke test fails:

1. **Immediate**: Rollback to previous deployment
   ```bash
   # Vercel
   vercel rollback

   # Railway
   railway rollback
   ```

2. **Notify**: Alert team via Slack/email

3. **Investigate**: Review Sentry errors and logs

4. **Fix**: Address critical issues

5. **Re-test**: Run smoke test on staging

6. **Re-deploy**: Deploy fix to production

7. **Re-smoke**: Run smoke test again

---

*Last Updated: 2025-11-19*
*Sprint 18 Phase 4 Task 4.2*

# Production Load Testing - Ready to Execute

**Date**: 2025-11-21
**Version**: 4.0.0
**Status**: ✅ **READY TO RUN**

---

## 🎯 Prerequisites Check

✅ **Monitoring Active**:
- Frontend monitor: https://stats.uptimerobot.com/YG9jgdt2TX
- Backend health monitor: Active
- Public status page: Live

✅ **Load Test Script**:
- Script location: `load-test-advanced.js` (root directory)
- npm scripts configured
- Dependencies installed (`socket.io-client`)

✅ **Production Environment**:
- Frontend: https://jaffre.vercel.app/
- Backend: https://anthropicjoffre-production.up.railway.app
- Health check: https://anthropicjoffre-production.up.railway.app/api/health

---

## 🚀 Available Load Tests

### Test 1: Baseline Performance Test (RECOMMENDED FIRST)
**Duration**: ~5 minutes
**Load**: 10 concurrent games (40 players)
**Risk**: ⚠️ LOW - Safe for production

```bash
BACKEND_URL=https://anthropicjoffre-production.up.railway.app NUM_GAMES=10 node load-test-advanced.js
```

**What It Tests**:
- Normal performance metrics
- WebSocket connection stability
- Game creation/joining success rate
- Average response times

**Expected Results** (Good Performance):
- Game creation success rate: ≥ 90%
- Player join success rate: ≥ 90%
- Average latency: < 300ms
- Total errors: < 10

---

### Test 2: Stress Test
**Duration**: ~10 minutes
**Load**: 20 concurrent games (80 players)
**Risk**: ⚠️ MEDIUM - May impact real users

```bash
BACKEND_URL=https://anthropicjoffre-production.up.railway.app NUM_GAMES=20 node load-test-advanced.js
```

**What It Tests**:
- System capacity limits
- Performance degradation under load
- Memory usage patterns

**Expected Results** (Good Scalability):
- Game creation success rate: ≥ 85%
- Player join success rate: ≥ 85%
- Average latency: < 500ms
- No memory leaks

---

### Test 3: Spike Test
**Duration**: ~15 minutes
**Load**: 5 → 30 → 5 games (gradual ramp)
**Risk**: ⚠️ MEDIUM - Tests recovery capabilities

```bash
BACKEND_URL=https://anthropicjoffre-production.up.railway.app TEST_TYPE=spike NUM_GAMES=30 node load-test-advanced.js
```

**What It Tests**:
- Sudden traffic surge handling
- Recovery time after load spike
- Memory cleanup after users disconnect

**Expected Results** (Good Resilience):
- Handles spike without crashes
- Recovery time: < 2 minutes
- Memory returns to baseline

---

## ⏰ When to Run Tests

### Recommended Schedule

**Baseline Test** (Test 1):
- ✅ Safe to run anytime (low load)
- Recommended: During low-traffic hours (2-6 AM) or immediately if urgent

**Stress/Spike Tests** (Tests 2-3):
- ⚠️ Only during low-traffic hours
- Recommended: 2-6 AM in your timezone
- Notify team before running
- Have monitoring dashboards open

### Before Running Tests

**Pre-Flight Checklist**:
- [ ] Check current production traffic (Railway dashboard)
- [ ] Verify monitoring is active (UptimeRobot)
- [ ] Open Railway metrics: https://railway.com/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
- [ ] Open Sentry dashboard: https://sentry.io
- [ ] Note baseline resource usage (CPU, memory)

---

## 📊 Monitoring During Tests

### Dashboards to Watch

**1. UptimeRobot Status Page**:
- URL: https://stats.uptimerobot.com/YG9jgdt2TX
- Watch for: Service going down (red status)

**2. Railway Metrics**:
- URL: https://railway.com/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
- Watch for:
  - CPU usage (alert if > 80%)
  - Memory usage (alert if > 400MB)
  - Active connections spike

**3. Sentry Dashboard**:
- Watch for: Error rate spike, new error types

**4. Railway Logs** (in separate terminal):
```bash
railway logs --tail 100
```

---

## 🚨 Stop Criteria (Emergency)

**Immediately stop test if**:
- CPU sustained > 90% for 2+ minutes
- Memory > 450MB (approaching Railway limit)
- Error rate > 10%
- Service becomes unresponsive
- Database connection errors appear

**How to Stop**:
1. Press `Ctrl+C` in terminal running load test
2. Wait 5 minutes for system to recover
3. Check Railway metrics return to baseline

---

## 📝 Documenting Results

After each test, record:

**Create File**: `docs/deployment/LOAD_TEST_RESULTS_2025-11-21.md`

**Template**:
```markdown
# Load Test Results - Production

**Date**: 2025-11-21
**Version**: 4.0.0
**Test**: Baseline (10 concurrent games)

## Test Configuration
- Backend URL: https://anthropicjoffre-production.up.railway.app
- Concurrent Games: 10
- Duration: 5 minutes
- Game Duration Each: 30 seconds

## Results (from script output)

### Connection Metrics
- Games Created: X/10 (X%)
- Players Joined: X/30 (X%)
- Games Failed: X
- Players Connected: X
- Players Disconnected: X

### Latency Statistics
- Average: X ms
- Min: X ms
- Max: X ms
- 95th Percentile (p95): X ms
- 99th Percentile (p99): X ms

### Reconnection Metrics
- Attempts: X
- Successes: X
- Failures: X
- Success Rate: X%

### Transport Distribution
- WebSocket: X (X%)
- Polling: X (X%)

### Error Summary
- Total Errors: X
- Connection Errors: X
- Game Creation Errors: X
- Player Join Errors: X

## Resource Usage (Railway Dashboard)

### CPU
- Average: X%
- Peak: X%

### Memory
- Start: X MB
- End: X MB
- Peak: X MB
- Growth: X MB

### Active Connections
- Peak: X

## Analysis

### Performance Assessment
- ✅/⚠️/❌ Overall performance
- ✅/⚠️/❌ Latency acceptable
- ✅/⚠️/❌ Error rate acceptable
- ✅/⚠️/❌ No memory leaks detected

### Issues Found
1. [Issue description if any]
2. [Issue description if any]

### Recommendations
1. [Recommendation based on results]
2. [Recommendation based on results]

## Next Steps
- [ ] Address any critical issues
- [ ] Run next test level (if baseline passed)
- [ ] Update capacity planning
```

---

## 🎯 Success Criteria

### Baseline Test (10 games)
**PASS if**:
- ✅ Game creation success rate ≥ 90%
- ✅ Player join success rate ≥ 90%
- ✅ Average latency < 500ms
- ✅ Total errors < 10
- ✅ CPU < 60%
- ✅ Memory growth < 100MB

**WARNING if**:
- ⚠️ Game creation success rate 80-90%
- ⚠️ Average latency 500-1000ms
- ⚠️ CPU 60-80%
- ⚠️ Errors 10-20

**FAIL if**:
- ❌ Game creation success rate < 80%
- ❌ Average latency > 1000ms
- ❌ CPU > 80%
- ❌ Errors > 20
- ❌ Memory leak detected (linear growth)

---

## 📋 Quick Start Commands

### Run Baseline Test NOW (5 minutes)
```bash
# Set production URL
BACKEND_URL=https://anthropicjoffre-production.up.railway.app NUM_GAMES=10 node load-test-advanced.js
```

### Monitor in Separate Terminal
```bash
# Railway logs
railway logs --tail 100

# Or watch status page
# https://stats.uptimerobot.com/YG9jgdt2TX
```

---

## 🔗 Related Documentation

- [LOAD_TESTING_PRODUCTION.md](./LOAD_TESTING_PRODUCTION.md) - Comprehensive guide
- [MONITORING_SETUP_COMPLETE.md](./MONITORING_SETUP_COMPLETE.md) - Monitoring overview
- [PRODUCTION_URLS.md](./PRODUCTION_URLS.md) - All production URLs
- [Sprint 19 Plan](../sprints/SPRINT_19_PLAN.md) - Sprint overview

---

## 💡 Pro Tips

1. **Start Small**: Always run baseline test (10 games) first
2. **Watch Metrics**: Keep Railway dashboard open during tests
3. **Document Everything**: Copy full output to results file
4. **Low-Traffic Hours**: Run stress tests at 2-6 AM
5. **Recovery Time**: Wait 5-10 minutes between tests
6. **Save Logs**: `railway logs --tail 1000 > logs-before-test.txt`

---

## ✅ You're Ready!

**To start your first load test**:
```bash
BACKEND_URL=https://anthropicjoffre-production.up.railway.app NUM_GAMES=10 node load-test-advanced.js
```

**Estimated time**: 5-7 minutes (includes setup + test + results)

---

*Created: 2025-11-21*
*Status: ✅ Ready for execution*
*Recommended: Start with baseline test (10 games)*

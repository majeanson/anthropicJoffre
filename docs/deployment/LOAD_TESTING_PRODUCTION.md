# Production Load Testing Guide

**Last Updated**: 2025-11-21 (v4.0.0)
**Target Environment**: Production (https://anthropicjoffre-production.up.railway.app)
**Estimated Time**: 1-2 hours
**⚠️ WARNING**: Test during low-traffic periods to avoid impacting real users

---

## 🎯 Overview

This guide shows you how to run load tests against your **production environment** to:
1. Establish performance baselines
2. Identify breaking points
3. Verify scalability
4. Detect memory leaks or performance regressions

**Tools Used**:
- `load-test-advanced.js` (already in your project)
- Node.js built-in performance monitoring

---

## ⚠️ Pre-Test Checklist

### Before Running Load Tests

- [ ] **Schedule Test**: Run during low-traffic hours (2-6 AM)
- [ ] **Notify Team**: Inform team members about load test
- [ ] **Check Baseline**: Note current resource usage (Railway dashboard)
- [ ] **Set Up Monitoring**: Open these tabs:
  - Railway Metrics: https://railway.com/project/b33d63ae-9286-4a4a-9480-f4d7f6e816de
  - Sentry Dashboard: https://sentry.io
  - UptimeRobot (if configured)
- [ ] **Database Backup**: Verify recent backup exists (Railway auto-backups daily)

---

## 📊 Test 1: Baseline Performance Test

**Goal**: Establish normal performance metrics with moderate load

**Test Duration**: 5 minutes
**Concurrent Games**: 10
**Total Users**: 40 (10 games × 4 players)

### Run Test

```bash
# Set backend URL to production
export BACKEND_URL=https://anthropicjoffre-production.up.railway.app

# Run baseline test
NUM_GAMES=10 node load-test-advanced.js
```

### Expected Results (Good Performance)

```
✅ Baseline Performance Test Results
================================================
Duration: 5 minutes
Concurrent Games: 10
Total Players: 40

Metrics:
- WebSocket Connect Time: < 200ms (p95)
- Round Completion Time: < 2000ms (p95)
- Memory Growth: < 50MB over test duration
- Error Rate: < 1%
- Games Completed: 10/10 (100%)

Resource Usage (Railway Dashboard):
- CPU: 20-40%
- Memory: 200-300MB
- Active Connections: ~40-50
```

### Warning Signs

⚠️ **Review if you see**:
- WebSocket connect time > 500ms
- Round completion time > 5000ms
- Memory growth > 100MB (possible leak)
- Error rate > 5%
- CPU sustained > 60%

### Document Baseline

Create `docs/deployment/PERFORMANCE_BASELINE_PRODUCTION.md`:

```markdown
# Production Performance Baseline

**Date**: 2025-11-21
**Version**: v4.0.0
**Test**: Baseline (10 concurrent games)

## Metrics
- WebSocket Connect: XXXms (p50), XXXms (p95)
- Round Completion: XXXms (p50), XXXms (p95)
- Memory Start: XXX MB
- Memory End: XXX MB
- Memory Growth: XXX MB
- Error Rate: X.X%
- Success Rate: XX.X%

## Resource Usage
- CPU Average: XX%
- CPU Peak: XX%
- Memory Average: XXX MB
- Memory Peak: XXX MB
- Active Connections Peak: XX
```

---

## 📊 Test 2: Stress Test

**Goal**: Find breaking point and maximum capacity

**Test Duration**: 10-15 minutes
**Concurrent Games**: Start at 20, increase to breaking point
**Total Users**: 80+ (20+ games × 4 players)

### Run Test

```bash
# Moderate stress test
export BACKEND_URL=https://anthropicjoffre-production.up.railway.app
NUM_GAMES=20 node load-test-advanced.js
```

### Monitor During Test

**Watch Railway Dashboard**:
1. CPU usage (alert if > 80%)
2. Memory usage (alert if > 400MB)
3. Network throughput
4. Active connections

**Watch Sentry**:
1. Error rate spike
2. New error types
3. Performance degradation

**Watch Logs**:
```bash
# In separate terminal
railway logs --tail 100
```

### Expected Results (Good Scalability)

```
✅ Stress Test Results (20 Games)
================================================
Duration: 10 minutes
Concurrent Games: 20
Total Players: 80

Metrics:
- WebSocket Connect Time: < 300ms (p95)
- Round Completion Time: < 3000ms (p95)
- Memory Growth: < 100MB
- Error Rate: < 3%
- Games Completed: 19-20/20 (95%+)

Resource Usage:
- CPU: 40-60%
- Memory: 300-400MB
- Active Connections: ~80-100
```

### Breaking Point Indicators

🚨 **Stop test immediately if**:
- CPU sustained > 90% for 2+ minutes
- Memory > 450MB (approaching Railway limit)
- Error rate > 10%
- Response time > 10 seconds
- Database connection errors

**If Breaking Point Reached**:
1. Note the concurrent game count
2. Stop test (`Ctrl+C`)
3. Let system recover (5 minutes)
4. Document maximum capacity

---

## 📊 Test 3: Spike Test

**Goal**: Test system recovery from sudden traffic spike

**Test Pattern**:
1. Start with 5 games (baseline)
2. Spike to 30 games (sudden load)
3. Drop back to 5 games (recovery)

### Run Test

```bash
# Spike test configuration
export BACKEND_URL=https://anthropicjoffre-production.up.railway.app
TEST_TYPE=spike NUM_GAMES=30 node load-test-advanced.js
```

### Monitor Recovery

**Watch for**:
1. How quickly system handles spike
2. Error rate during spike
3. Recovery time after spike drops
4. Memory cleanup after users disconnect

### Expected Results (Good Resilience)

```
✅ Spike Test Results
================================================
Phase 1 (Baseline): 5 games → Normal performance
Phase 2 (Spike): 30 games → Temporary slowdown, but stable
Phase 3 (Recovery): 5 games → Returns to baseline quickly

Recovery Time: < 2 minutes
Error Rate During Spike: < 5%
Memory Cleanup: Returns to baseline ± 20MB
```

### Warning Signs

⚠️ **Review if**:
- System crashes during spike
- Recovery takes > 5 minutes
- Memory doesn't return to baseline
- Errors persist after spike ends

---

## 📊 Test 4: Endurance Test

**Goal**: Detect memory leaks and long-running stability issues

**Test Duration**: 30-60 minutes
**Concurrent Games**: 10 (moderate load)

### Run Test

```bash
# Long-running endurance test
export BACKEND_URL=https://anthropicjoffre-production.up.railway.app
NUM_GAMES=10 node load-test-advanced.js &

# Monitor for 30-60 minutes
# Check Railway metrics every 10 minutes
```

### Monitor Memory Growth

**Every 10 minutes, record**:
- Memory usage (Railway dashboard)
- Active connections
- Response times
- Error count

**Plot Memory Over Time**:
```
Memory (MB)
500 │                                    ← Bad (linear growth = leak)
400 │                        ╱
300 │           ╱───────────
200 │  ────────             ← Good (flat = no leak)
100 │
    └────────────────────────────────
    0    10    20    30    40    50    60 (minutes)
```

### Expected Results (No Memory Leak)

```
✅ Endurance Test Results (60 minutes)
================================================
Duration: 60 minutes
Concurrent Games: 10 (continuous)

Memory Profile:
- Memory Start: 250 MB
- Memory End: 280 MB
- Memory Growth: 30 MB (acceptable)
- Memory Pattern: Flat (no leak)

Performance:
- Response Time Degradation: < 10%
- Error Rate: < 1%
- All games completed successfully
```

### Memory Leak Detection

🚨 **Memory Leak Suspected if**:
- Linear memory growth (50MB+ per 30 min)
- Memory doesn't stabilize
- Memory > 450MB after 60 minutes
- Out of memory errors in logs

**Action if Memory Leak Found**:
1. Stop test immediately
2. Review Sentry for specific errors
3. Check for unclosed connections
4. Review recent code changes
5. Create GitHub issue with heap snapshot

---

## 📊 Test Results Summary Template

After all tests, create summary document:

**File**: `docs/deployment/LOAD_TEST_RESULTS_YYYY-MM-DD.md`

```markdown
# Load Test Results - Production

**Date**: 2025-11-21
**Version**: v4.0.0
**Environment**: Production (Railway)

## Test Summary

| Test | Games | Duration | Success Rate | Errors | Notes |
|------|-------|----------|--------------|--------|-------|
| Baseline | 10 | 5 min | 100% | 0 | ✅ Passed |
| Stress | 20 | 10 min | 95% | 2 | ✅ Passed |
| Spike | 5→30→5 | 15 min | 98% | 1 | ✅ Passed |
| Endurance | 10 | 60 min | 100% | 0 | ✅ No leak |

## Performance Metrics

### Response Times (p95)
- WebSocket Connect: XXX ms
- Round Completion: XXX ms
- Database Queries: XX ms

### Resource Usage
- CPU Peak: XX%
- Memory Peak: XXX MB
- Concurrent Connections Peak: XX

## Capacity Analysis

**Maximum Capacity** (before degradation):
- Concurrent Games: XX
- Concurrent Players: XXX
- Recommended Max: XX games (80% of max)

## Issues Found

1. **Issue**: [Description]
   - **Severity**: P1/P2/P3
   - **Impact**: [Impact on users]
   - **Action**: [Created GitHub issue #XXX]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Next Steps

- [ ] Address P1 issues immediately
- [ ] Schedule P2 issues for next sprint
- [ ] Re-test after fixes deployed
- [ ] Update capacity planning docs
```

---

## 🎯 Performance Targets (For Reference)

### Good Performance (Green)
- **WebSocket Connect**: < 200ms (p95)
- **Round Completion**: < 2000ms (p95)
- **Memory Growth**: < 50MB/hour
- **Error Rate**: < 1%
- **CPU Usage**: < 60% average
- **Success Rate**: > 99%

### Acceptable Performance (Yellow)
- **WebSocket Connect**: 200-500ms (p95)
- **Round Completion**: 2000-5000ms (p95)
- **Memory Growth**: 50-100MB/hour
- **Error Rate**: 1-5%
- **CPU Usage**: 60-80% average
- **Success Rate**: 95-99%

### Poor Performance (Red - Action Required)
- **WebSocket Connect**: > 500ms (p95)
- **Round Completion**: > 5000ms (p95)
- **Memory Growth**: > 100MB/hour (leak suspected)
- **Error Rate**: > 5%
- **CPU Usage**: > 80% sustained
- **Success Rate**: < 95%

---

## 🔧 Troubleshooting Common Issues

### High CPU Usage (> 80%)

**Possible Causes**:
- Too many concurrent games for current Railway plan
- Inefficient game logic (tight loops)
- Bot AI calculations too heavy

**Solutions**:
1. Upgrade Railway plan (more CPU cores)
2. Optimize hot code paths (use Sentry profiling)
3. Reduce bot difficulty in production
4. Add connection rate limiting

### High Memory Usage (> 400MB)

**Possible Causes**:
- Memory leak (unclosed connections, event listeners)
- Too many games cached in memory
- Large WebSocket message buffers

**Solutions**:
1. Review for memory leaks (heap snapshot)
2. Implement game state cleanup
3. Add connection timeout/cleanup
4. Upgrade Railway plan (more RAM)

### Slow Response Times

**Possible Causes**:
- Database query performance
- Network latency (Railway region)
- Too many concurrent connections

**Solutions**:
1. Add database indexes
2. Optimize N+1 queries
3. Enable connection pooling (already done)
4. Consider read replicas (advanced)

### High Error Rate

**Possible Causes**:
- Database connection exhaustion
- Race conditions under load
- WebSocket timeout issues

**Solutions**:
1. Check Sentry for specific errors
2. Review logs for patterns
3. Increase connection pool size
4. Add retry logic for transient errors

---

## 📈 Capacity Planning

After load tests, calculate your capacity:

**Formula**:
```
Recommended Max = Breaking Point × 0.8 (80% safety margin)
```

**Example**:
- Breaking Point: 30 concurrent games
- Recommended Max: 24 concurrent games
- Safety Buffer: 6 games (20%)

**Document in**: `docs/deployment/CAPACITY_PLANNING.md`

---

## 🚨 Important Warnings

### Do NOT Run These Tests on Production

❌ **Never test** on production:
- Tests that create thousands of users
- Tests that fill up database
- Tests lasting hours (use staging instead)
- Tests that intentionally crash the server

✅ **Safe for production** (with caution):
- Short baseline tests (5-10 min)
- Moderate load tests (< 30 games)
- Scheduled during low-traffic hours
- With team notification and monitoring

### When to Use Staging Instead

Use staging environment for:
- Very long tests (> 1 hour)
- Extreme load tests (> 50 games)
- Failure scenario testing
- Database migration testing
- Breaking changes testing

---

## 📞 Post-Test Actions

### After Successful Tests

1. ✅ Document results (see template above)
2. ✅ Update capacity planning
3. ✅ Share results with team
4. ✅ Archive test data (30 days retention)
5. ✅ Schedule next test (monthly recommended)

### After Failed Tests or Issues Found

1. 🚨 Create GitHub issues for all P1/P2 problems
2. 🚨 Notify team of capacity limits
3. 🚨 Create action plan for fixes
4. 🚨 Schedule re-test after fixes deployed
5. 🚨 Update incident response runbook

---

## 🎯 Next Steps (Sprint 19)

- [ ] Run baseline test (Test 1)
- [ ] Document baseline results
- [ ] Run stress test (Test 2)
- [ ] Determine maximum capacity
- [ ] Run spike test (Test 3)
- [ ] Run endurance test (Test 4)
- [ ] Create summary report
- [ ] Update capacity planning
- [ ] Address any issues found

---

## 🔗 Related Documentation

- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Infrastructure overview
- [PRODUCTION_URLS.md](./PRODUCTION_URLS.md) - Production environment URLs
- [UPTIME_MONITORING.md](./UPTIME_MONITORING.md) - Monitoring setup
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) - Incident handling

---

*Last Updated: 2025-11-21 (v4.0.0)*
*⚠️ Always run production load tests during low-traffic hours*
*Recommended: 2-6 AM in your timezone*
